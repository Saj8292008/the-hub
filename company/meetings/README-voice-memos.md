# Voice Memo Generation for The Hub

## Quick Start

Generate a voice memo from a text script:

```bash
export ELEVENLABS_API_KEY=sk_e74d504796b9fb9bcf5a533083232f7803b1d368b8fffc15

cat your-script.txt | sag \
  --voice-id "pNInz6obpgDQGcFmaJgB" \
  --model-id "eleven_turbo_v2_5" \
  --stability 0.5 \
  --similarity 0.75 \
  --style 0.4 \
  -o output.mp3 \
  --metrics
```

## Voice: Adam (pNInz6obpgDQGcFmaJgB)
- Deep, professional male voice
- Sounds like a chill co-founder giving business updates
- Clear and engaging for weekly syncs

## Settings Explained
- **stability 0.5**: Balanced between consistent and expressive
- **similarity 0.75**: Stays close to the reference voice character
- **style 0.4**: Moderate stylization for natural delivery
- **model eleven_turbo_v2_5**: Fast generation, good quality

## Script Format Tips
- Use `[excited]`, `[pause]`, `[sighs]` for emotional cues
- Natural conversational language works best
- Keep it under 2000 characters for best results

## Example Output
See `2026-02-06-weekly-sync.mp3` - Generated from script with:
- 1609 characters
- 1.7MB MP3
- 3 seconds generation time
- Professional co-founder vibe ✓

## Troubleshooting
- Always export the API key first
- If you get 401 errors, the key might need refresh
- Can't list voices? That's normal - permissions are restricted
- Just use the voice IDs directly

---
**Last Updated:** 2026-02-06
**Status:** ✅ Working
