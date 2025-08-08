import { Link } from "react-router-dom";
import BoxReveal from "./components/BoxReveal";
import { MorphingTextDemo } from "./components/Demo";
import ScriptGenerator from "./components/Generator";
import { SphereAnimation } from "./components/Sphere";
import Voice from "./components/Voice";

function App() {
  return (
    <div className="bg-black h-screen w-screen overflow-x-hidden px-32 text-white ">
      <div className="flex justify-center items-center gap-9 ml-9">
        <div className="basis-1/2">
          <MorphingTextDemo />
          <div className="mt-9 font-poppins">
            <BoxReveal color="#fe7cff">
              <p className="text-[3.5rem] font-semibold">
                <span className="text-[#fe7cff]">NPC</span>raft
                <span className="text-[#fe7cff]">.</span>
              </p>
            </BoxReveal>

            <BoxReveal color="#fe7cff" duration={0.8}>
              <h2 className="mt-[.5rem] text-[1.2rem]">
                Generate lifelike NPC dialogue with
                <span className="text-[#fe7cff]"> AI.</span>
              </h2>
            </BoxReveal>

            <BoxReveal color="#fe7cff" duration={1}>
              <div className="mt-6">
                <p>
                  -&gt; Create
                  <span className="font-semibold text-[#fe7cff]">
                    {" "}
                    dynamic, character-based conversations
                  </span>{" "}
                  for games and simulations.
                  <br />
                  -&gt; Maintain
                  <span className="font-semibold text-[#fe7cff]">
                    {" "}
                    consistent voice, tone, and personality
                  </span>{" "}
                  across dialogue.
                  <br />
                  -&gt; React to
                  <span className="font-semibold text-[#fe7cff]">
                    {" "}
                    player input in real time
                  </span>{" "}
                  <br />
                </p>
              </div>

              <div className="mt-8">
                <Link
                  to={"/voice"}
                  className="inline-block bg-[#fe7cff] text-black font-poppins font-semibold uppercase px-8 py-3 rounded-lg hover:bg-[#e066e6] transition-colors duration-300 shadow-lg hover:shadow-[#fe7cff]/25"
                >
                  Get Started
                </Link>
              </div>
            </BoxReveal>
          </div>
        </div>
        <div className="basis-2/4">
          <SphereAnimation />
        </div>
      </div>

      {/* <Voice/> */}
      {/* <ScriptGenerator/> */}
    </div>
  );
}

export default App;
