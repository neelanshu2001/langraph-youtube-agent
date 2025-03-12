"use server";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOllama } from "@langchain/ollama";
import playwright from "playwright";
import { z } from "zod";

export async function transcribe(videoUrl: string) {
  const getYoutubeDetails = tool(
    async (input) => {
      console.log(input);
      if (input?.videoId) {
        const browser = await playwright["chromium"].launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(`https://www.youtube.com/watch?v=${input.videoId}`);
        const title = await page.locator("h1.ytd-watch-metadata").innerText();

        // Wait for the "expand" button to be available and click it (to expand the transcript section)
        const expandButtonSelector = "tp-yt-paper-button#expand";
        await page.waitForSelector(expandButtonSelector);
        await page.click(expandButtonSelector);

        // Wait for the "Show Transcript" button to be available and click it
        const showTranscriptButtonSelector =
          "button.yt-spec-button-shape-next--outline";
        await page.waitForSelector(showTranscriptButtonSelector);
        await page.click(showTranscriptButtonSelector);

        // Wait for the transcript panel to be visible
        const transcriptPanelSelector =
          "#body.ytd-transcript-search-panel-renderer";
        await page.waitForSelector(transcriptPanelSelector);

        // Extract the transcript segments
        const transcriptText = await page.evaluate(() => {
          const segments = document.querySelectorAll(
            "ytd-transcript-segment-renderer"
          );
          const transcript = [] as Array<string>;
          segments.forEach((segment: any) => {
            const timestamp = segment
              .querySelector(".segment-timestamp")
              .textContent.trim();
            const text = segment
              .querySelector(".segment-text")
              .textContent.trim();
            if (timestamp && text) {
              transcript.push(`${timestamp} - ${text}`);
            }
          });
          return transcript.join("\n");
        });

        await browser.close();
        return {
          title,
          transcript: transcriptText,
        };
      } else {
        console.log("not found");
        return "Not found";
      }
    },
    {
      name: "getYoutubeDetails",
      description: "Call to get title and description of youtube video",
      schema: z.object({
        videoId: z.string().describe("The youtube video id"),
      }),
    }
  );

  const agent = await createReactAgent({
    llm: new ChatOllama({ model: "llama3.2", temperature: 0, format: "json" }),
    tools: [getYoutubeDetails],
  });
  console.log(videoUrl);
  const response = await agent.invoke({
    messages: [
      new SystemMessage(`
            You're a YouTube transcription agent.

            You need to extract the videoId from the provided YouTube URL. Then use the extracted videoId to retrieve the title and transcript of the video using the getYoutubeDetails tool.
            Use all tools at your disposal.

            you have the following tools:
            1. getYoutubeDetails:
            - Query: { getYoutubeDetails(videoId: $videoId) { title,  transcript  } }
            - Variables: { "videoId": "VIDEO_ID"}

            Summarize the transcript to generate the description
            Return output in the following structure:

            {
                "videoId": "videoId extracted from the URL",
                "title": "video title",
                "description" : "video description",
                "transcript": "transcript of the video"
            }
        `),
      new HumanMessage(`Here is the YouTube URL: ${videoUrl}.`),
    ],
  });
  console.log(response.messages);
  return response.messages[response.messages.length - 1].content;
}
