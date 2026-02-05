#!/usr/bin/env python3
"""
Instagram Deal Poster for The Hub
Posts deals to Instagram with auto-generated images
"""

import json
import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired

# Paths
CREDENTIALS_PATH = Path.home() / ".thehub-secrets" / "instagram.json"
SESSION_PATH = Path.home() / ".thehub-secrets" / "instagram_session.json"
ASSETS_PATH = Path(__file__).parent.parent / "assets" / "instagram"

# Brand colors
BRAND_COLORS = {
    "watches": "#1a1a2e",
    "sneakers": "#16213e", 
    "cars": "#0f3460",
    "default": "#1a1a2e"
}

ACCENT_COLOR = "#e94560"
TEXT_COLOR = "#ffffff"


def load_credentials():
    """Load Instagram credentials from file"""
    if not CREDENTIALS_PATH.exists():
        raise FileNotFoundError(f"Credentials not found at {CREDENTIALS_PATH}")
    
    with open(CREDENTIALS_PATH) as f:
        return json.load(f)


def get_client():
    """Get authenticated Instagram client"""
    creds = load_credentials()
    cl = Client()
    
    # Try to load existing session
    if SESSION_PATH.exists():
        try:
            cl.load_settings(SESSION_PATH)
            cl.login(creds["username"], creds["password"])
            # Verify session is valid
            cl.get_timeline_feed()
            print("✅ Logged in with existing session")
            return cl
        except (LoginRequired, ChallengeRequired, Exception) as e:
            print(f"⚠️ Session invalid, re-logging: {e}")
    
    # Fresh login
    try:
        cl.login(creds["username"], creds["password"])
        cl.dump_settings(SESSION_PATH)
        print("✅ Fresh login successful")
        return cl
    except ChallengeRequired:
        print("❌ Challenge required - need manual verification")
        print("   Try logging in via browser first")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Login failed: {e}")
        sys.exit(1)


def create_deal_image(deal: dict, output_path: str) -> str:
    """Generate a deal image for Instagram"""
    
    # Image dimensions (Instagram square)
    width, height = 1080, 1080
    
    # Get category color
    category = deal.get("category", "default").lower()
    bg_color = BRAND_COLORS.get(category, BRAND_COLORS["default"])
    
    # Create image
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load fonts, fall back to default
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        price_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 96)
        body_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    except:
        title_font = ImageFont.load_default()
        price_font = title_font
        body_font = title_font
        small_font = title_font
    
    # Draw "THE HUB" logo at top
    draw.text((540, 60), "THE HUB", font=title_font, fill=ACCENT_COLOR, anchor="mt")
    
    # Draw category tag
    category_display = category.upper() if category != "default" else "DEAL"
    draw.text((540, 150), f"🔥 {category_display} DEAL", font=body_font, fill=TEXT_COLOR, anchor="mt")
    
    # Draw deal title (wrap if needed)
    title = deal.get("title", "Hot Deal!")
    if len(title) > 40:
        title = title[:37] + "..."
    draw.text((540, 350), title, font=body_font, fill=TEXT_COLOR, anchor="mm")
    
    # Draw price box
    price = deal.get("price", "")
    original_price = deal.get("original_price", "")
    discount = deal.get("discount", "")
    
    if price:
        # Price background
        draw.rectangle([240, 450, 840, 600], fill=ACCENT_COLOR)
        draw.text((540, 525), price, font=price_font, fill=TEXT_COLOR, anchor="mm")
    
    # Original price (struck through)
    if original_price:
        draw.text((540, 650), f"Was: {original_price}", font=body_font, fill="#888888", anchor="mt")
    
    # Discount badge
    if discount:
        draw.text((540, 720), f"💰 {discount} OFF", font=body_font, fill="#00ff88", anchor="mt")
    
    # Source
    source = deal.get("source", "")
    if source:
        draw.text((540, 850), f"📍 {source}", font=small_font, fill="#aaaaaa", anchor="mt")
    
    # CTA
    draw.text((540, 950), "Link in bio → the-hub-psi.vercel.app", font=small_font, fill=TEXT_COLOR, anchor="mt")
    
    # Save
    img.save(output_path, "JPEG", quality=95)
    print(f"✅ Created image: {output_path}")
    return output_path


def generate_caption(deal: dict) -> str:
    """Generate Instagram caption for a deal"""
    title = deal.get("title", "Hot Deal!")
    price = deal.get("price", "")
    original_price = deal.get("original_price", "")
    discount = deal.get("discount", "")
    category = deal.get("category", "").lower()
    source = deal.get("source", "")
    url = deal.get("url", "")
    
    # Build caption
    lines = [
        f"🔥 {title}",
        ""
    ]
    
    if price:
        lines.append(f"💰 NOW: {price}")
    if original_price:
        lines.append(f"📉 Was: {original_price}")
    if discount:
        lines.append(f"✅ Save {discount}!")
    
    lines.append("")
    
    if source:
        lines.append(f"📍 From: {source}")
    
    lines.extend([
        "",
        "👆 Link in bio to shop all deals!",
        "",
        "─────────────────",
    ])
    
    # Hashtags based on category
    hashtags = ["#deals", "#discount", "#sale", "#savemoney", "#thehubdeals"]
    
    if category == "watches":
        hashtags.extend(["#watches", "#watchdeals", "#luxurywatches", "#watchcollector", "#timepiece"])
    elif category == "sneakers":
        hashtags.extend(["#sneakers", "#sneakerdeals", "#kicks", "#sneakerhead", "#kotd"])
    elif category == "cars":
        hashtags.extend(["#cars", "#cardeals", "#automotive", "#carsofinstagram", "#cardeal"])
    
    lines.append(" ".join(hashtags))
    
    return "\n".join(lines)


def post_deal(deal: dict, dry_run: bool = False) -> dict:
    """Post a deal to Instagram"""
    
    # Create temp image
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        image_path = f.name
    
    try:
        # Generate image
        create_deal_image(deal, image_path)
        
        # Generate caption
        caption = generate_caption(deal)
        
        if dry_run:
            print("\n📝 DRY RUN - Would post:")
            print(f"Image: {image_path}")
            print(f"Caption:\n{caption}")
            return {"success": True, "dry_run": True}
        
        # Post to Instagram
        cl = get_client()
        media = cl.photo_upload(image_path, caption)
        
        print(f"✅ Posted to Instagram: {media.pk}")
        return {
            "success": True,
            "media_id": str(media.pk),
            "media_code": media.code,
            "url": f"https://instagram.com/p/{media.code}"
        }
        
    finally:
        # Cleanup temp image
        if os.path.exists(image_path):
            os.remove(image_path)


def post_story(deal: dict, dry_run: bool = False) -> dict:
    """Post a deal as Instagram story"""
    
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        image_path = f.name
    
    try:
        create_deal_image(deal, image_path)
        
        if dry_run:
            print("\n📝 DRY RUN - Would post story")
            return {"success": True, "dry_run": True}
        
        cl = get_client()
        media = cl.photo_upload_to_story(image_path)
        
        print(f"✅ Posted story: {media.pk}")
        return {
            "success": True,
            "media_id": str(media.pk)
        }
        
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)


def main():
    """CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Post deals to Instagram")
    parser.add_argument("--title", help="Deal title")
    parser.add_argument("--price", help="Current price")
    parser.add_argument("--original-price", help="Original price")
    parser.add_argument("--discount", help="Discount amount")
    parser.add_argument("--category", default="default", help="Category: watches, sneakers, cars")
    parser.add_argument("--source", help="Deal source (e.g., Amazon, Chrono24)")
    parser.add_argument("--url", help="Deal URL")
    parser.add_argument("--story", action="store_true", help="Post as story instead")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually post")
    parser.add_argument("--test-login", action="store_true", help="Just test login")
    
    args = parser.parse_args()
    
    if args.test_login:
        cl = get_client()
        info = cl.account_info()
        print(f"✅ Logged in as @{info.username}")
        print(f"   Followers: {info.follower_count}")
        print(f"   Following: {info.following_count}")
        return
    
    if not args.title:
        parser.error("--title is required for posting")
    
    deal = {
        "title": args.title,
        "price": args.price,
        "original_price": args.original_price,
        "discount": args.discount,
        "category": args.category,
        "source": args.source,
        "url": args.url
    }
    
    if args.story:
        result = post_story(deal, dry_run=args.dry_run)
    else:
        result = post_deal(deal, dry_run=args.dry_run)
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
