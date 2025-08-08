import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import BoxReveal from "./BoxReveal";

interface PersonaState {
  backstory: string;
  audioUrl?: string;
  isLoading: boolean;
  npcName?: string;
  personalityTraits?: string[];
  dialogueGoal?: string;
  sampleDialogue?: string;
  voiceStyle?: {
    tone: string;
    accent: string;
    pace: string;
  };
  // Store full generated data for chat
  fullPersonaData?: any;
}

interface PersonalityTrait {
  trait: string;
  intensity: number;
  description?: string;
}

const Voice: React.FC = () => {
  const navigate = useNavigate();
  const [gameContext, setGameContext] = useState<string>("");
  const [stageContext, setStageContext] = useState<string>("");
  const [npcName, setNpcName] = useState<string>("");
  const [npcContext, setNpcContext] = useState<string>("");
  const [npcGender, setNpcGender] = useState<string>("neutral");
  const [personalityTraits, setPersonalityTraits] = useState<
    PersonalityTrait[]
  >([{ trait: "", intensity: 0.5, description: "" }]);
  const [dialogueGoal, setDialogueGoal] = useState<string>("");
  const [sampleText, setSampleText] = useState<string>("");
  const [intents, setIntents] = useState<string[]>(["guidance"]);

  const [generatedPersona, setGeneratedPersona] = useState<PersonaState>({
    backstory: "",
    isLoading: false,
  });
  const [showPersona, setShowPersona] = useState<boolean>(false);

  // Personality trait functions
  const addPersonalityTrait = () => {
    setPersonalityTraits([
      ...personalityTraits,
      { trait: "", intensity: 0.5, description: "" },
    ]);
  };

  const removePersonalityTrait = (index: number) => {
    if (personalityTraits.length > 1) {
      const newTraits = personalityTraits.filter((_, i) => i !== index);
      setPersonalityTraits(newTraits);
    }
  };

  const updatePersonalityTrait = (
    index: number,
    field: keyof PersonalityTrait,
    value: string | number
  ) => {
    const newTraits = [...personalityTraits];
    (newTraits[index] as any)[field] = value;
    setPersonalityTraits(newTraits);
  };

  // Navigate to chat with persona data
  const navigateToChat = () => {
    if (generatedPersona.fullPersonaData) {
      // Store persona data in localStorage for the chat page
      localStorage.setItem(
        "npcPersonaData",
        JSON.stringify(generatedPersona.fullPersonaData)
      );
      navigate("/chat");
    }
  };

  // Get character image path based on selected persona
  const getCharacterImagePath = () => {
    const selectedPersona =
      generatedPersona.fullPersonaData?.selected_persona || "Gloam";
    return `/2d/${selectedPersona}.png`;
  };

  // Download persona JSON
  const downloadPersonaJSON = () => {
    if (generatedPersona.fullPersonaData?.generatedResponse) {
      const jsonData = generatedPersona.fullPersonaData.generatedResponse;
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        generatedPersona.fullPersonaData.npcName || "npc-character"
      }-persona.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Generate NPC persona
  const generatePersona = async () => {
    if (!gameContext.trim() || !npcName.trim()) {
      alert("Please provide both game context and NPC name");
      return;
    }

    // Check if at least one personality trait has a name
    const validTraits = personalityTraits.filter((trait) => trait.trait.trim());
    if (validTraits.length === 0) {
      alert("Please provide at least one personality trait");
      return;
    }

    // Combine all NPC information into npc_context
    const combinedNpcContext = [
      npcContext,
      stageContext && `Location: ${stageContext}`,
      dialogueGoal && `Goal: ${dialogueGoal}`,
      validTraits.length > 0 &&
        `Personality: ${validTraits
          .map((trait) =>
            trait.description
              ? `${trait.trait} (${Math.round(trait.intensity * 100)}% - ${
                  trait.description
                })`
              : `${trait.trait} (${Math.round(trait.intensity * 100)}%)`
          )
          .join(", ")}`,
      sampleText && `Speaking style: "${sampleText}"`,
    ]
      .filter(Boolean)
      .join(". ");

    setGeneratedPersona({ backstory: "", isLoading: true });

    try {
      const response = await axios.post(
        "https://npc-rafter.vercel.app/npc/create-persona-langchain",
        {
          game_context: gameContext,
          npc_context: combinedNpcContext,
          gender: npcGender,
        }
      );

      const data = response.data;

      // Format the backstory with additional details
      const formattedBackstory = `${data.backstory}

Character Traits: ${data.personality_traits.join(", ")}

Dialogue Goal: ${data.dialogue_goal}

Sample Dialogue: "${data.sample_dialogue}"`;

      setGeneratedPersona({
        backstory: formattedBackstory,
        isLoading: false,
        npcName: npcName, // Use user-entered name instead of API response name
        personalityTraits: data.personality_traits,
        dialogueGoal: data.dialogue_goal,
        sampleDialogue: data.sample_dialogue,
        voiceStyle: data.voice_style,
        fullPersonaData: {
          npcName, // User-entered name
          gameContext,
          stageContext,
          npcContext,
          npcGender,
          personalityTraits: validTraits,
          dialogueGoal,
          sampleText,
          intents,
          selected_persona: data.selected_persona || "Gloam", // Use selected_persona from API response
          generatedResponse: data,
        },
      });
      setShowPersona(true);
    } catch (error) {
      console.error("Error generating persona:", error);
      // Show error message if API fails
      setGeneratedPersona({
        backstory:
          "Failed to generate persona. Please check your internet connection and try again. Make sure both game context and NPC context are provided with sufficient detail.",
        audioUrl: "/voice.wav",
        isLoading: false,
        npcName: "Error - Character Not Generated",
      });
      setShowPersona(true);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8 text-white relative">
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="group flex items-center space-x-2 px-4 py-2 bg-black/80 backdrop-blur-sm border border-[#fe7cff]/30 rounded-lg hover:border-[#fe7cff] hover:bg-[#fe7cff]/10 transition-all duration-300 font-poppins"
        >
          <svg
            className="w-4 h-4 text-[#fe7cff] group-hover:text-white transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[#fe7cff] group-hover:text-white transition-colors duration-300 text-sm font-medium">
            Home
          </span>
        </Link>
      </div>

      <div className="w-[80vw] mx-auto rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide font-monument text-4xl text-white font-semibold mb-1 w-fit">
            <BoxReveal color="#fe7cff">NPC Creator Studio</BoxReveal>
          </div>

          <div className="w-fit">
            <BoxReveal color="#fe7cff" duration={0.8}>
              <h1 className="text-lg font-medium mb-2 text-[#fe7cff] font-poppins">
                Build Immersive Game Characters
              </h1>
              <p className="text-gray-400 mb-6 font-poppins">
                Create dynamic NPCs with rich backstories and authentic dialogue
                for your games
              </p>
            </BoxReveal>
          </div>

          <section className="w-[80vw]">
            <div className="container mx-auto flex flex-col p-6">
              {/* <h2 className="py-4 text-3xl font-poppins text-[#fe7cff] font-bold text-center">Clone your voice</h2> */}
              <div className="divide-y dark:divide-gray-300">
                <BoxReveal color="#fe7cff">
                  <div className="grid justify-center grid-cols-4 p-8 mx-auto space-y-8 lg:space-y-0 relative">
                    <div className="flex items-center justify-center lg:col-span-1 col-span-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-16 h-16"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <g>
                          <rect
                            x="5.5"
                            y="6.6165"
                            width="7.6031"
                            height="29.8423"
                            rx="1"
                            ry="1"
                          />
                          <rect
                            x="16.5636"
                            y="6.6165"
                            width="7.6031"
                            height="29.8423"
                            rx="1"
                            ry="1"
                          />
                          <rect
                            x="30.9108"
                            y="6.3431"
                            width="7.6033"
                            height="29.8418"
                            rx="1"
                            ry="1"
                            transform="translate(-4.6835 11.0135) rotate(-16.9062)"
                          />
                          <rect
                            x="5.5"
                            y="39.0428"
                            width="37"
                            height="2.828"
                            rx="1"
                            ry="1"
                          />
                        </g>
                      </svg>
                    </div>
                    <div className="flex flex-col justify-center max-w-3xl text-center col-span-full lg:col-span-3 lg:text-left">
                      <span className="text-sm tracking-wider uppercase text-[#fe7cff] font-poppins mb-1">
                        Step 1
                      </span>
                      <span className="text-xl font-medium md:text-2xl font-poppins">
                        Set Game & NPC Context
                      </span>
                      {/* <span className="mt-4 dark:text-gray-300">Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam facilis, voluptates error alias dolorem praesentium sit soluta iure incidunt labore explicabo eaque, quia architecto veritatis dolores, enim cons equatur nihil ipsum.</span> */}
                      <div className="mb-6 mt-5">
                        <label
                          htmlFor="gameContext"
                          className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                        >
                          Game Context
                        </label>
                        <textarea
                          id="gameContext"
                          rows={3}
                          value={gameContext}
                          onChange={(e) => setGameContext(e.target.value)}
                          placeholder="Describe the game world, setting, time period, and overall atmosphere..."
                          className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                        />
                      </div>

                      <div className="mb-6 space-y-4">
                        {/* NPC Name */}
                        <div>
                          <label
                            htmlFor="npcName"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            NPC Name *
                          </label>
                          <input
                            id="npcName"
                            type="text"
                            value={npcName}
                            onChange={(e) => setNpcName(e.target.value)}
                            placeholder="e.g., Elara the Sage, Marcus the Blacksmith..."
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label
                            htmlFor="npcGender"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            Gender
                          </label>
                          <select
                            id="npcGender"
                            value={npcGender}
                            onChange={(e) => setNpcGender(e.target.value)}
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>

                        {/* Stage Context */}
                        <div>
                          <label
                            htmlFor="stageContext"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            Stage/Location Context
                          </label>
                          <input
                            id="stageContext"
                            type="text"
                            value={stageContext}
                            onChange={(e) => setStageContext(e.target.value)}
                            placeholder="e.g., At the Ruins of Thalindra, a crumbling fortress..."
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          />
                        </div>

                        {/* NPC Context */}
                        <div>
                          <label
                            htmlFor="npcContext"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            NPC Description *
                          </label>
                          <textarea
                            id="npcContext"
                            rows={3}
                            value={npcContext}
                            onChange={(e) => setNpcContext(e.target.value)}
                            placeholder="Describe the NPC's role, background, and current situation..."
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          />
                        </div>

                        {/* Dialogue Goal */}
                        <div>
                          <label
                            htmlFor="dialogueGoal"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            Dialogue Goal
                          </label>
                          <input
                            id="dialogueGoal"
                            type="text"
                            value={dialogueGoal}
                            onChange={(e) => setDialogueGoal(e.target.value)}
                            placeholder="e.g., Guide adventurers with wisdom, Sell magical items..."
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          />
                        </div>

                        {/* Sample Text */}
                        <div>
                          <label
                            htmlFor="sampleText"
                            className="block text-sm font-medium text-[#fe7cff] mb-1 font-poppins"
                          >
                            Sample Dialogue
                          </label>
                          <input
                            id="sampleText"
                            type="text"
                            value={sampleText}
                            onChange={(e) => setSampleText(e.target.value)}
                            placeholder="e.g., Seek the light within the shadows, traveler."
                            className="w-full px-3 py-2 border border-white bg-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white font-poppins"
                          />
                        </div>
                      </div>

                      {/* Personality Traits with Sliders */}
                      <div className="mb-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-[#fe7cff] font-poppins">
                            Personality Traits
                          </h3>
                          <button
                            type="button"
                            onClick={addPersonalityTrait}
                            className="px-3 py-1 text-xs bg-[#fe7cff] text-black rounded hover:bg-[#e066e6] transition-colors font-poppins"
                          >
                            + Add Trait
                          </button>
                        </div>

                        {personalityTraits.map((trait, index) => (
                          <div
                            key={index}
                            className="space-y-2 p-3 border border-gray-700 rounded-lg bg-gray-900/30"
                          >
                            {/* Trait Name Input */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={trait.trait}
                                onChange={(e) =>
                                  updatePersonalityTrait(
                                    index,
                                    "trait",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter trait name (e.g., wise, mysterious, brave...)"
                                className="flex-1 px-3 py-2 text-sm border border-gray-600 bg-gray-800 rounded text-white font-poppins focus:outline-none focus:ring-1 focus:ring-pink-500"
                              />
                              {personalityTraits.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePersonalityTrait(index)}
                                  className="px-2 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {/* Intensity Slider */}
                            {trait.trait && (
                              <>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium text-[#fe7cff] font-poppins capitalize">
                                    {trait.trait} Intensity
                                  </label>
                                  <span className="text-xs text-[#fe7cff] font-poppins">
                                    {(trait.intensity * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={trait.intensity}
                                  onChange={(e) =>
                                    updatePersonalityTrait(
                                      index,
                                      "intensity",
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #fe7cff 0%, #fe7cff ${
                                      trait.intensity * 100
                                    }%, #374151 ${
                                      trait.intensity * 100
                                    }%, #374151 100%)`,
                                  }}
                                />

                                {/* Description Input */}
                                <input
                                  type="text"
                                  value={trait.description}
                                  onChange={(e) =>
                                    updatePersonalityTrait(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Describe how ${trait.trait} manifests (optional)`}
                                  className="w-full px-2 py-1 text-xs border border-gray-600 bg-gray-800 rounded text-white font-poppins focus:outline-none focus:ring-1 focus:ring-pink-500"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mb-6 bg-black rounded-lg">
                        <p className="text-white font-poppins text-base mb-4">
                          Provide detailed context about your game world and NPC
                          character to generate more authentic and immersive
                          dialogue.
                        </p>
                      </div>
                    </div>
                  </div>
                </BoxReveal>
                <BoxReveal color="#fe7cff" duration={0.8}>
                  <div className="grid justify-center grid-cols-4 p-8 mx-auto space-y-8 lg:space-y-0">
                    <div className="flex items-center justify-center lg:col-span-1 col-span-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="w-16 h-16"
                      >
                        <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col justify-center max-w-3xl text-center col-span-full lg:col-span-3 lg:text-left">
                      <span className="text-sm tracking-wider uppercase text-[#fe7cff] font-poppins mb-1">
                        Step 2
                      </span>
                      <span className="text-xl font-medium md:text-2xl font-poppins">
                        Generate NPC Persona
                      </span>
                      {/* <span className="mt-4 dark:text-gray-700">Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam facilis, voluptates error alias dolorem praesentium sit soluta iure incidunt labore explicabo eaque, quia architecto veritatis dolores, enim cons equatur nihil ipsum.</span> */}
                      <div className="mb-6 mt-3">
                        <p className="text-white font-poppins text-base mb-4">
                          Generate a detailed backstory and sample voice for
                          your NPC based on the context you provided.
                        </p>

                        <button
                          onClick={generatePersona}
                          disabled={
                            !gameContext.trim() ||
                            !npcName.trim() ||
                            generatedPersona.isLoading
                          }
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed mb-6"
                          style={{
                            backgroundColor:
                              !gameContext.trim() ||
                              !npcName.trim() ||
                              generatedPersona.isLoading
                                ? "#666"
                                : "#fe7cff",
                          }}
                        >
                          {generatedPersona.isLoading ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Generating Persona...
                            </span>
                          ) : (
                            "Generate NPC Persona"
                          )}
                        </button>

                        {/* Display Generated Persona with Character */}
                        {showPersona &&
                          generatedPersona.backstory &&
                          !generatedPersona.isLoading && (
                            <div className="border border-gray-700 rounded-lg p-6 mb-4">
                              <h3 className="text-xl font-semibold text-[#fe7cff] mb-4 font-poppins text-center">
                                Meet Your NPC:{" "}
                                {generatedPersona.npcName || "Your Character"}
                              </h3>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Character Image Display */}
                                <div className="flex flex-col items-center">
                                  <div className="w-64 h-64 bg-gray-800 border-2 border-[#fe7cff] rounded-lg overflow-hidden relative group">
                                    <img
                                      src={getCharacterImagePath()}
                                      alt={
                                        generatedPersona.npcName ||
                                        "NPC Character"
                                      }
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      onError={(e) => {
                                        console.error(
                                          "Failed to load character image"
                                        );
                                        e.currentTarget.src =
                                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMjggODBDMTA0IDgwIDg0IDEwMCA4NCAxMjRTMTA0IDE2OCAxMjggMTY4UzE3MiAxNDggMTcyIDEyNFMxNTIgODAgMTI4IDgwWk0xMjggMTQ0QzExNiAxNDQgMTA2IDEzNCAxMDYgMTIyUzExNiAxMDAgMTI4IDEwMFMxNTAgMTEwIDE1MCAxMjJTMTQwIDE0NCAxMjggMTQ0WiIgZmlsbD0iI0ZFN0NGRiIvPgo8cGF0aCBkPSJNMTI4IDE4NEMxMDQgMTg0IDg0IDIwNCA4NCAyMjhIMTcyQzE3MiAyMDQgMTUyIDE4NCAxMjggMTg0WiIgZmlsbD0iI0ZFN0NGRiIvPgo8L3N2Zz4K";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-2 left-2 right-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <span className="text-xs text-[#fe7cff] font-poppins bg-black bg-opacity-70 px-2 py-1 rounded">
                                        {generatedPersona.fullPersonaData
                                          ?.selected_persona || "Gloam"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Backstory */}
                                <div className="flex flex-col justify-center">
                                  <h4 className="text-lg font-semibold text-[#fe7cff] mb-3 font-poppins">
                                    📜 Character Backstory
                                  </h4>
                                  <p className="text-white font-poppins text-sm leading-relaxed">
                                    {generatedPersona.backstory}
                                  </p>

                                  {generatedPersona.personalityTraits && (
                                    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                      <h5 className="text-sm font-medium text-[#fe7cff] mb-2 font-poppins">
                                        ⚔️ Character Traits
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {generatedPersona.personalityTraits.map(
                                          (trait, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 bg-[#fe7cff] text-black text-xs rounded font-poppins"
                                            >
                                              {trait}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </BoxReveal>
                <BoxReveal color="#fe7cff" duration={1}>
                  <div className="grid justify-center grid-cols-4 p-8 mx-auto space-y-8 lg:space-y-0">
                    <div className="flex items-center justify-center lg:col-span-1 col-span-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="w-16 h-16"
                      >
                        <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95.1 57.3 130.1C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col justify-center max-w-3xl text-center col-span-full lg:col-span-3 lg:text-left">
                      <span className="text-sm tracking-wider uppercase text-[#fe7cff] font-poppins mb-1">
                        Step 3
                      </span>
                      <span className="text-xl font-medium md:text-2xl font-poppins">
                        Talk to Your NPC
                      </span>
                      {/* <span className="mt-4 dark:bg-gray-100 dark:text-gray-700">Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam facilis, voluptates error alias dolorem praesentium sit soluta iure incidunt labore explicabo eaque, quia architecto veritatis dolores, enim cons equatur nihil ipsum.</span> */}
                      <div className="mb-6 mt-3">
                        <p className="text-white font-poppins text-base mb-4">
                          Start an interactive conversation with your generated
                          NPC. Experience real-time dialogue based on the
                          context and persona you've created.
                        </p>

                        <div className="space-y-3">
                          <button
                            onClick={navigateToChat}
                            disabled={!generatedPersona.backstory}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300"
                            style={{
                              backgroundColor: !generatedPersona.backstory
                                ? "#666"
                                : "#fe7cff",
                            }}
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Talk to NPCs
                          </button>

                          <button
                            onClick={downloadPersonaJSON}
                            disabled={!generatedPersona.backstory}
                            className="w-full flex justify-center py-3 px-4 border border-[#fe7cff] rounded-md shadow-sm text-sm font-medium text-[#fe7cff] hover:bg-[#fe7cff] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:border-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-300"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download Persona JSON
                          </button>
                        </div>

                        {!generatedPersona.backstory && (
                          <p className="text-gray-400 text-sm mt-2 font-poppins text-center">
                            Complete Step 2 to unlock NPC conversation
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </BoxReveal>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Voice;
