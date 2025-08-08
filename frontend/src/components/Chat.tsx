import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import BoxReveal from "./BoxReveal";
import Character3D from "./Character3D";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
  debugInfo?: {
    rawResponse?: any;
    extractedAudioUrl?: string;
    fullAudioUrl?: string;
  };
}

const Chat: React.FC = () => {
  // Load persona data from localStorage
  const [personaData, setPersonaData] = useState<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Function to get character model path
  const getCharacterModelPath = () => {
    // Available character models from the actual folder structure
    const availableCharacters = [
      "Barkel",
      "Boneguard",
      "Bricktee",
      "Drakblade",
      "Gloam",
      "Pawvo",
      "Plumeca",
      "Popestep",
      "Steelord",
    ];

    // Use selected_persona from persona data, fallback to "Gloam" if not available
    const selectedCharacter = personaData?.selected_persona || "Gloam";

    // Verify the selected character exists in available characters, fallback to "Gloam"
    const finalCharacter = availableCharacters.includes(selectedCharacter)
      ? selectedCharacter
      : "Gloam";

    return `/3d/${finalCharacter}/base_basic_shaded.glb`;
  };

  // Load persona data on component mount
  useEffect(() => {
    const storedPersonaData = localStorage.getItem("npcPersonaData");
    if (storedPersonaData) {
      const parsedData = JSON.parse(storedPersonaData);
      setPersonaData(parsedData);

      // Set initial greeting message
      setMessages([
        {
          id: "1",
          text: `Hello! I'm ${parsedData.npcName || "your NPC character"}. ${
            parsedData.sampleText || "What would you like to talk about?"
          }`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } else {
      // Fallback if no persona data
      setMessages([
        {
          id: "1",
          text: "Hello! I'm your NPC character. What would you like to talk about?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Audio control functions
  const toggleAudio = (messageId: string, audioUrl: string) => {
    const audio = audioRefs.current[messageId];

    if (playingAudio === messageId) {
      // Currently playing this audio, pause it
      if (audio) {
        audio.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }

      // Start playing this audio
      if (audio) {
        audio.play().catch(console.error);
        setPlayingAudio(messageId);
      }
    }
  };

  const handleAudioEnded = (messageId: string) => {
    setPlayingAudio(null);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the NPC dialogue API
      const response = await fetch(
        "https://npcrafter.onrender.com/preview-dialogue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            npc_traits: personaData
              ? {
                  name: personaData.npcName || "NPC Character",
                  personality_traits: personaData.personalityTraits?.map(
                    (trait: any) => trait.trait
                  ) || ["helpful"],
                  dialogue_goal:
                    personaData.dialogueGoal || "assist the player",
                  backstory: personaData.npcContext || "A helpful character",
                  visual_style: "realistic",
                  voice_style: {
                    tone: "friendly",
                    accent: "neutral",
                  },
                }
              : {
                  name: "Eldrin the Sage",
                  personality_traits: ["wise", "mysterious", "helpful"],
                  dialogue_goal: "provide guidance",
                  backstory:
                    "An ancient sage who has lived in these lands for centuries",
                  visual_style: "realistic",
                  voice_style: {
                    tone: "deep",
                    accent: "mystical",
                  },
                },
            message: inputMessage,
            player_stats: {
              health: 75,
              inventory: [
                { item: "sword", quantity: 1 },
                { item: "health_potion", quantity: 3 },
              ],
              completed_quests: [
                "Rescue the villager",
                "Defeat the goblin camp",
              ],
              battle_logs: [
                {
                  enemy: "Goblin",
                  outcome: "victory",
                  timestamp: "2023-08-07T10:15:30",
                },
              ],
              achievements: ["First blood", "Explorer"],
              location: personaData?.stageContext || "Forest of Whispers",
            },
          }),
        }
      );

      const data = await response.json();
      console.log("API Response:", data); // Debug log

      // Clean up the dialogue text by removing emotion prefixes
      let dialogueText =
        data.dialogue?.text || data.response || "I'm thinking about that...";

      // Remove emotion prefixes like "THOUGHTFUL:", "ANGRY:", etc.
      dialogueText = dialogueText.replace(/^[A-Z]+:\s*/, "");

      // Check for audio URL
      const audioUrl = data.dialogue?.audio_url;
      console.log("Audio URL from API:", audioUrl); // Debug log

      const fullAudioUrl =
        audioUrl && audioUrl.trim() !== ""
          ? `https://npcrafter.onrender.com${audioUrl}`
          : undefined;

      console.log("Full Audio URL:", fullAudioUrl); // Debug log

      const npcMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: dialogueText,
        isUser: false,
        timestamp: new Date(),
        audioUrl: fullAudioUrl,
        // Add debug info to the message
        // debugInfo: {
        //   rawResponse: data,
        //   extractedAudioUrl: audioUrl,
        //   fullAudioUrl: fullAudioUrl,
        // },
      };

      setMessages((prev) => [...prev, npcMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/voice"
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
            Back to Creator
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="text-center">
            <BoxReveal color="#fe7cff">
              <h1 className="text-2xl font-semibold font-poppins">
                <span className="text-[#fe7cff]">NPC</span> Conversation
              </h1>
            </BoxReveal>
            <p className="text-gray-400 text-sm font-poppins mt-1">
              Chat with your generated NPC character
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full min-h-0">
        {/* Left Column - NPC Profile */}
        <div className="w-1/3 border-r border-gray-800 p-6 flex flex-col overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#fe7cff] font-poppins mb-2">
              {personaData?.npcName || "NPC Character"}
            </h2>
            <p className="text-gray-400 text-sm font-poppins">
              {personaData?.stageContext || "Your Generated Character"}
            </p>
          </div>

          {/* 3D Character Model */}
          <div className="flex-shrink-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm h-96 bg-gray-900/30 rounded-lg border border-gray-700 overflow-hidden">
              <Character3D
                modelPath={getCharacterModelPath()}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* NPC Stats */}
          <div className="mt-6 space-y-3">
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-[#fe7cff] mb-2 font-poppins">
                Personality Traits
              </h3>
              <div className="flex flex-wrap gap-2">
                {personaData?.personalityTraits?.map(
                  (trait: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#fe7cff] text-black text-xs rounded font-poppins capitalize"
                    >
                      {trait.trait}
                    </span>
                  )
                ) || (
                  <>
                    <span className="px-2 py-1 bg-[#fe7cff] text-black text-xs rounded font-poppins">
                      Wise
                    </span>
                    <span className="px-2 py-1 bg-[#fe7cff] text-black text-xs rounded font-poppins">
                      Mysterious
                    </span>
                    <span className="px-2 py-1 bg-[#fe7cff] text-black text-xs rounded font-poppins">
                      Helpful
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-[#fe7cff] mb-2 font-poppins">
                Background
              </h3>
              <p className="text-gray-300 text-xs font-poppins">
                {personaData?.npcContext ||
                  "An ancient sage who has lived in these mystical lands for centuries, possessing vast knowledge of magic and lore."}
              </p>
            </div>

            <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-[#fe7cff] mb-2 font-poppins">
                Dialogue Goal
              </h3>
              <p className="text-gray-300 text-xs font-poppins">
                {personaData?.dialogueGoal || "Provide guidance and wisdom"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="w-2/3 flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {messages.map((message) => {
              console.log(`Message ${message.id} audioUrl:`, message.audioUrl); // Debug log
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-2 ${
                      message.isUser ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isUser
                          ? "bg-[#fe7cff] text-black"
                          : "bg-gray-800 text-white border border-gray-700"
                      }`}
                    >
                      <p className="font-poppins text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Audio Player Button - Only for NPC messages with audio */}
                    {!message.isUser && message.audioUrl && (
                      <div className="flex-shrink-0">
                        {/* Hidden audio element */}
                        <audio
                          ref={(el) => {
                            if (el) audioRefs.current[message.id] = el;
                          }}
                          src={message.audioUrl}
                          preload="metadata"
                          onEnded={() => handleAudioEnded(message.id)}
                        />

                        {/* Play/Pause Button */}
                        <button
                          onClick={() =>
                            toggleAudio(message.id, message.audioUrl!)
                          }
                          className="w-8 h-8 rounded-full bg-[#fe7cff] hover:bg-[#e066e6] transition-colors duration-200 flex items-center justify-center"
                          title={
                            playingAudio === message.id ? "Pause" : "Play Audio"
                          }
                        >
                          {playingAudio === message.id ? (
                            <svg
                              className="w-4 h-4 text-black"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-black ml-0.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white border border-gray-700 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#fe7cff] rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-[#fe7cff] rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[#fe7cff] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm font-poppins text-gray-400">
                      NPC is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-800 p-4 flex-shrink-0">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message to the NPC..."
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fe7cff] focus:border-transparent text-white font-poppins resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-2 bg-[#fe7cff] text-black font-medium rounded-lg hover:bg-[#e066e6] transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed font-poppins"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
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
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
