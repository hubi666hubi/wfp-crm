import re

with open('src/components/layout/AppLayout.tsx', 'r') as f:
    content = f.read()

# Find the return ( and the next div
return_str = '  return (\n    <div className="min-h-screen bg-black text-gray-100 flex overflow-hidden selection:bg-rose-500/30 relative">'

replacement = '''  return (
    <div className="min-h-screen bg-black text-gray-100 flex overflow-hidden selection:bg-rose-500/30 relative">
      {/* GLOBAL APOCALYPSE BACKGROUND */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-luminosity bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/eye_of_ra.jpg)' }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-black/80 to-black/95" />

      {/* Content wrapper with z-index to stay above background */}
      <div className="flex w-full z-10 relative">
'''

# We also need to add a closing div at the very end
content = content.replace(return_str, replacement)
content = content.replace('    </div>\n  );\n}', '      </div>\n    </div>\n  );\n}')

with open('src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(content)
