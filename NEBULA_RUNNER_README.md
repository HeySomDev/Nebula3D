# Nebula Runner - 3D Space Dodger

একটি সুন্দর 3D space dodger গেম যা Nebula3D engine-এ built।

## চেষ্টা করুন

### Development Mode
```bash
npm install
npm run dev -- --host
```

তারপর ব্রাউজারে `http://localhost:5173/game.html` খুলুন।

### Production Build
```bash
npm run build
```

## গেম নিয়ন্ত্রণ

- **চলাচল**: `← →` বা `A` `D` কী দিয়ে
- **স্পর্শ**: মাউস ড্র্যাগ
- **শুরু করুন**: Start বাটনে ক্লিক করুন বা স্পেস বার চাপুন

## উদ্দেশ্য

- গ্রহাণু এড়ান 🚀
- নীল orbs সংগ্রহ করুন এবং স্কোর বাড়ান
- যতক্ষণ সম্ভব টিকে থাকুন
- আপনার সর্বোচ্চ স্কোর রেকর্ড করুন

## বৈশিষ্ট্য

✨ সুন্দর 3D নিওন গ্রাফিক্স  
🎮 মসৃণ গেমপ্লে এবং কন্ট্রোল  
⭐ প্রগতিশীল কঠিনতা  
🎵 রিয়েল-টাইম স্কোর ট্র্যাকিং  
💾 localStorage-এ সেরা স্কোর সংরক্ষণ  

## প্রযুক্তি

- **Engine**: Nebula3D (Custom WebGL engine)
- **Rendering**: Three.js
- **Language**: TypeScript
- **Build Tool**: Vite

## আর্কিটেকচার

```
src/
├── engine/          # Nebula3D engine core (untouched)
├── game/
│   └── NebulaRunnerGame.ts  # Game logic
├── gameMain.ts      # Game entry point
└── game.css         # Game styles
```

## মূল ফাইল

- `game.html` - Game HTML entry
- `src/gameMain.ts` - Game initialization
- `src/game/NebulaRunnerGame.ts` - Complete game implementation
- `src/game.css` - Game styling

## লাইসেন্স

MIT
