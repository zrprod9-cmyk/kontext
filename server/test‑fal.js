import { fal } from "@fal-ai/client";

// 1 ─ вставьте ключ ровно как скопировали из панели
const FAL_KEY = "fb6bef13-8cf6-4fad-a6c0-d64654b43cf6:04d5c3c39152b7c8b17313f3421e1fb1";

fal.config({ credentials: FAL_KEY });

(async () => {
  try {
    // 2 ─ самый короткий вызов (из «Submit a request», стр. 3 PDF) :contentReference[oaicite:3]{index=3}
    const result = await fal.subscribe("fal-ai/flux-kontext-lora", {
      input: {
        image_url: "https://storage.googleapis.com/falserverless/example_inputs/kontext_example_input.webp",
        prompt:    "ping"
      },
      sync_mode: true
    });
    console.log("✅ OK, получил url:", result.data?.images?.[0]?.url);
  } catch (e) {
    console.error("❌ Fal ответил:", e.status, e.body || e.message);
  }
})();
