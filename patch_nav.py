import re

with open('src/components/layout/AppLayout.tsx', 'r') as f:
    content = f.read()

# Add the navigation item right after OMEGA Pro Insights
nav_str = "  { name: 'OMEGA Pro Insights', to: '/pro-dashboard', icon: Award },"
new_nav = "  { name: 'OMEGA Pro Insights', to: '/pro-dashboard', icon: Award },\n  { name: 'Elite Vault (DNA)', to: '/elite-vault', icon: Eye },"

content = content.replace(nav_str, new_nav)

with open('src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(content)
