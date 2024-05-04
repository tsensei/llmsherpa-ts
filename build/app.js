import { LLMSherpaFileLoader } from "./lib/LLMSherpaFileLoader.js";
const loader = new LLMSherpaFileLoader("https://arxiv.org/pdf/1706.03762", true, true, "chunks");
const docs = await loader.load();
console.log(docs);
//# sourceMappingURL=app.js.map