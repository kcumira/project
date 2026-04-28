import json
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import HTTPException
from google.api_core.exceptions import ResourceExhausted

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-2.5-flash"


def analyze_food_image(image_bytes: bytes, mime_type: str) -> dict:
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")

    prompt = """
You are SmartFood's food inventory scanner.
Analyze the image and identify the most likely food item for inventory entry.

Return ONLY a valid JSON object with these exact fields:
{
  "name": "short food name",
  "category": "Vegetables | Fruits | Dairy | Meat | Bakery | Pantry | Food",
  "quantityEstimate": number,
  "unit": "pcs | g | kg | ml | L | pack | bunch | box | slice | serving",
  "expiryDaysEstimate": number or null,
  "storageSuggestion": "Fridge | Freezer | Pantry | Counter",
  "tags": ["Fresh", "Frozen", "Opened", "Organic", "Cooked", "Leftover"],
  "confidence": integer 0-100,
  "notes": "short user-facing note about uncertainty or visible condition"
}

Rules:
- Do not invent a precise expiration date from the image. Estimate days only when reasonable.
- If the image is unclear, use category "Food", confidence below 60, and explain uncertainty in notes.
- Keep the name concise, like "Apples", "Milk", "Spinach", or "Sourdough Bread".
- Pick tags only from the allowed list.
"""

    model = genai.GenerativeModel(MODEL_NAME)

    try:
      response = model.generate_content(
          [
              prompt,
              {
                  "mime_type": mime_type or "image/jpeg",
                  "data": image_bytes,
              },
          ],
          generation_config=genai.GenerationConfig(
              response_mime_type="application/json",
              temperature=0.2,
          ),
      )
      result = json.loads(response.text)
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="AI vision scan is rate limited. Please try again shortly.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned an unreadable scan result.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI vision scan failed: {str(e)}")

    return {
        "name": result.get("name") or "",
        "category": result.get("category") or "Food",
        "quantityEstimate": result.get("quantityEstimate") or 1,
        "unit": result.get("unit") or "pcs",
        "expiryDaysEstimate": result.get("expiryDaysEstimate"),
        "storageSuggestion": result.get("storageSuggestion") or "Fridge",
        "tags": result.get("tags") if isinstance(result.get("tags"), list) else [],
        "confidence": result.get("confidence") or 0,
        "notes": result.get("notes") or "",
    }

