"use client"
import Image from "next/image";
import { useState } from "react";
import { transcribe } from "./action";

type Video = {
  videoId: string,
  title: string,
  description :string,
  transcript: string
}

export default function Home() {
  const [videoUrl,setVideoUrl] = useState("");
  const [video, setVideo] = useState<Video>()

  const transcribeVideo = async()=>{
    console.log(videoUrl)
    const result = await transcribe(videoUrl);
    console.log(result)
    const parsedResult = JSON.parse(result as string)as Video;

    if(parsedResult?.videoId){
      setVideo(parsedResult)
      console.log(parsedResult)
    }
  }

  return (
   <div className="flex flex-col h-full bg-gray-800">
    <header className="bg-indigo-500 p-2">
      <div className="flex lg:flex-1 items-center justify-center">
        <a href="#" className="m-1.5">
          <span className="sr-only">LangGraph YouTube Transcribe Agent</span>
          <Image
            className="w-auto color-white"
            height={8}
            width = {8}
            src="http://localhost:3000/video-player.svg"
            alt=""
          />
        </a>
        <h1 className="text-black font-bold">YouTube Transcribe Agent</h1>
      </div>
    </header>
    <div>
    <div className="flex my-8 mx-40">
      <label htmlFor="email-address" className="sr-only"> Email address </label>
      <input
        id="video-link"
        name="video-link"
        type="link"
        required
        value={videoUrl}
        onChange={(e)=>{setVideoUrl(e.target.value)}}
        className="w-full mr-4 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
        placeholder="Enter a YouTube video link"
      />
      <button
        type="submit"
        onClick={()=>transcribeVideo()}
        className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        Let&apos;s go
      </button>
      </div>
    </div>
     {video && <div className="flex flex-col my-8 lg:mx-40 mx-8">
      <h1 className="text-2xl font-bold tracking-tight text-white mb-4">
        {video && video.title}
      </h1>
      <iframe
        width="560"
        height="315"
        // src="https://www.youtube.com/embed/xBSMBEowLcY?controls=0"
        src={`https://www.youtube.com/embed/${video && video.videoId}?controls=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>

      <div className="mt-4 text-white">
        <h2 className="font-bold text-lg mb-2">Description</h2>
        <p className="text-sm">{video && video.description}</p>
      </div>
      {
        video.transcript ? (
          <div className="mt-4 text-white">
            <h2 className="font-bold text-lg mb-2">Transcript</h2>

            <ul>
              {video.transcript.split('\n').map((item:string, idx)=>{
                return <li key={idx}>${item}</li>
              })}
            </ul>
          </div>
        ) : null
      }
    </div> }
   </div>
  )}
