import { LLMSherpaFileLoader } from "./lib/LLMSherpaFileLoader.js";

// Make sure you nlm-ingestor docker container is running and accessible on port 5010
const loader = new LLMSherpaFileLoader(
  "https://arxiv.org/pdf/1706.03762", // Can use both URL and File Path to a PDF
  true, // new indent parser
  true, // apply ocr
  "chunks" // chunks | sections | html | text
);

const docs = await loader.load();

console.log(docs); // {pateContent : string, metadata : {source : string, pageNumber : number }}
