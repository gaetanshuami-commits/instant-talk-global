import { WorkerOptions, cli, defineAgent, JobContext } from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

process.env.LIVEKIT_URL =
  process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();
    console.log("✅ Agent OpenAI temps réel connecté au Cloud LiveKit !");

    const realtimeApi = (openai as any)?.realtime;
    const RealtimeAgentCtor = realtimeApi?.RealtimeAgent;

    if (!RealtimeAgentCtor) {
      throw new Error(
        "OpenAI realtime agent API not available in @livekit/agents-plugin-openai"
      );
    }

    const agent = new RealtimeAgentCtor({
      model: "gpt-4o-realtime-preview",
      instructions:
        "Tu es un traducteur simultané humain et professionnel. Ton rôle est d'écouter la conversation. Si la personne parle en français, tu traduis en anglais avec une voix fluide. Si elle parle en anglais, tu traduis en français. Ne fais aucun commentaire, traduis juste ce que tu entends avec le ton le plus naturel possible.",
      voice: "alloy",
    });

    await agent.start(ctx.room);
  },
});

cli.runApp(new WorkerOptions({ agent: __filename }));