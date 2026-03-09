export async function extractPricesFromScreenshot(base64Image) {
    console.log('API KEY:', import.meta.env.VITE_CLAUDE_API_KEY);
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_DOPLNI_MICHAL') {
        throw new Error('Chýba VITE_CLAUDE_API_KEY v .env.local');
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-5", // Používame špecifikovaný model podľa zadania
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/png", // Anthropic akceptuje image/png, image/jpeg, image/webp, image/gif
                                data: base64Image
                            }
                        },
                        {
                            type: "text",
                            text: `Analyzuj screenshot z Crossout Mobile marketu.
Extrahuj KAŽDÚ viditeľnú položku v zozname.

Pre každú položku vráť:
- name: presný názov položky (string)
- power: číslo za slovom "Power" (number alebo null ak nie je viditeľné)
- sale: číslo v stĺpci "SALE" (number)
- purchase: číslo v stĺpci "PURCHASE" (number)

PRAVIDLÁ:
- Čísla s medzerami (napr. "12 066") spoj do jedného čísla: 12066
- Ignoruj ikony, šípky, farby, stĺpec "IN STORAGE"
- Ak položku nevidíš celú (orezaná zhora alebo zdola) — NEVRACEJ ju
- Vráť VÝLUČNE JSON array, žiadny iný text, žiadne markdown backticky

Formát:
[{"name":"Breaker","power":2099,"sale":12576,"purchase":15091},...]`
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        let errorMsg = `Claude API error: ${response.status}`;
        try {
            const errData = await response.json();
            if (errData.error?.message) errorMsg += ` - ${errData.error.message}`;
        } catch (e) {
            // ignore JSON parse error on error response
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Bezpečný parse — odstráň prípadné markdown obalenie
    const clean = text.replace(/```json|```/g, '').trim();

    try {
        return JSON.parse(clean);
    } catch (err) {
        console.error("Failed to parse Claude output:", text);
        throw new Error("Nepodarilo sa spracovať výsledok z API (neplatný JSON).");
    }
}
