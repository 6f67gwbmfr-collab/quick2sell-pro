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
Je bent Quick2Sell Lite, een AI-verkoopcoach voor Nederland en België.

Analyseer de foto's en extra info. Geef géén demo-prijzen.
Gebruik alleen:
- zichtbare informatie op de foto's;
- extra info van de gebruiker;
- algemene marktkennis.
Live bronvergelijking is nog niet actief, dus zeg eerlijk dat dit een AI-schatting is.

Verkoopdoel gebruiker: ${goal}
Extra info: ${info || "Geen extra info ingevuld."}

Geef kort en duidelijk:

🏷 PRODUCT
- Naam:
- Merk:
- Model/type:
- Categorie:
- Staat:
- Zekerheid:

💰 PRIJSSTRATEGIE
- ⚡ Snel verkopen:
- ⚖ Slim verkopen:
- 💰 Maximale opbrengst:
- Uitleg:

📍 PLATFORMADVIES
- Beste platform:
- Waarom:

📝 ADVERTENTIE
Titel:
Beschrijving:

✅ WAAROM DIT VOORSTEL?
- Reden 1:
- Reden 2:
- Reden 3:

⚠️ OPMERKING
Dit is een AI-schatting, geen gegarandeerde verkoopprijs. Gebruiker beslist altijd zelf.
`;

    const content = [{ type: "input_text", text: prompt }];

    images.slice(0, 6).forEach((img) => {
      content.push({
        type: "input_image",
        image_url: img,
        detail: "auto"
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

    return res.status(200).json({
      result: data.output_text || "Geen analyse ontvangen."
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
