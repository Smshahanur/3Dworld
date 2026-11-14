# 3DWorld Character GLB/GLTF/FBX Assets

Place professionally modelled, rigged human `.glb` (recommended), `.gltf`, or `.fbx` files in this directory (`/public/models/characters/`).

Vite automatically discovers any `.glb`, `.gltf`, or `.fbx` files placed here and registers them in `manifest.json` during `npm run dev` and `npm run build` — no code edits required.

## Required Model Files

| Role Key | Filename | Target Height | Description |
| :--- | :--- | :--- | :--- |
| `player_male` | `Athletic_man.glb` *(or `Athletic_man.fbx`)* | ~1.78 m | Supplied Athletic Man male player avatar |
| `player_female` | `player_female.glb` | ~1.65 m | Realistic young adult female player avatar |
| `npc_rural_male` | `npc_rural_male.glb` | ~1.76 m | Rural Village male resident (workwear / traditional) |
| `npc_rural_female` | `npc_rural_female.glb` | ~1.65 m | Rural Village female resident |
| `npc_modern_male` | `npc_modern_male.glb` | ~1.76 m | Modern Village male resident (modern casual) |
| `npc_modern_female` | `npc_modern_female.glb` | ~1.65 m | Modern Village female resident (modern casual) |
| `npc_capital_male` | `npc_capital_male.glb` | ~1.78 m | Capital Town male resident (formal business attire) |
| `npc_capital_female` | `npc_capital_female.glb` | ~1.66 m | Capital Town female resident (formal business attire) |

## Embedded Skeletal Animation Clip Names

The loader automatically matches animation clips case-insensitively across standard Mixamo / Ready Player Me / Blender conventions:

- **Idle**: `Idle`, `Standing_Idle`, `Breathing_Idle`
- **Walking**: `Walk`, `Walking`
- **Running**: `Run`, `Running`, `Jog`
- **Sprinting**: `Sprint`, `FastRun`
- **Turning**: `Turn`, `TurnLeft`, `TurnRight`
- **Talking**: `Talk`, `Talking`, `Conversation`
- **Sitting**: `Sit`, `Sitting`, `Seated`
- **Standing Up**: `Stand`, `StandUp`
- **Jump**: `Jump`, `Jumping`
- **Gestures**: `Wave`, `Cheer`, `Work`, `Dance`, `Carry`

## Mobile & Desktop Optimization Targets

- **Format**: Binary `.glb` (embedded PBR textures, optional Draco mesh compression) or `.fbx`
- **Triangle Budget**: 10,000 – 25,000 triangles per character for smooth 60 FPS on Android & desktop
- **Textures**: 1024×1024 or 2048×2048 (sRGB for BaseColor, Linear for Normal/Roughness/Metallic)
- **Pivot**: Feet grounded at `Y = 0`, character facing `+Z`
