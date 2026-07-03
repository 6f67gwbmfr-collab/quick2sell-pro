export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }

  try {
    const { images = [], info = "", goal = "slim" } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY ontbreekt in Vercel" });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Upload minimaal één foto" });
    }

    const prompt = `
Je bent Quick2Sell Pro, een AI-verkoopcoach voor Nederland en België.

Analyseer de foto's echt. Herken product, merk, model, staat en maak een eerlijk verkoopvoorstel.
Geef geen harde verkooptijd en geen gegarandeerde prijs.
Zeg eerlijk dat live marktvergelijking nog niet actief is.

Verkoopdoel: ${goal}
Extra info gebruiker: ${info || "Geen extra info ingevuld."}

Geef dit format:

🏷 PRODUCT
Naam:
Merk:
Model/type:
Categorie:
Staat:
Zekerheid:

💰 PRIJSSTRATEGIE
⚡ Snel verkopen:
⚖ Slim verkopen:
💰 Maximale opbrengst:
Waarom:

📍 PLATFORMADVIES
Beste platform:
Waarom:

📝 ADVERTENTIE
Titel:
Beschrijving:

✅ CONTROLEPUNTEN
- Wat moet gebruiker controleren?
- Welke foto ontbreekt eventueel?
- Waar moet gebruiker op letten?

⚠️ OPMERKING
Dit is een AI-schatting. Gebruiker beslist altijd zelf.
`;

    const content = [{ type: "input_text", text: prompt }];

    images.slice(0, 6).forEach(img => {
      content.push({
        type: "input_image",
        image_url: img
      });
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [{ role: "user", content }],
        max_output_tokens: 1400
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data?.error?.message || "OpenAI fout"
      });
    }

    const text =
      data.output_text ||
      data.output?.map(o => o.content?.map(c => c.text).join("\n")).join("\n") ||
      "Geen analyse ontvangen.";

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
