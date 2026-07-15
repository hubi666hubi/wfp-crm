import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add the lazy import
import_str = "const PricingPage = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));"
new_import = "const PricingPage = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));\nconst EliteVault = lazy(() => import('./pages/EliteVault').then(m => ({ default: m.EliteVault })));"
content = content.replace(import_str, new_import)

# Add the route
route_str = '<Route path="/pricing" element={<ErrorBoundary><PricingPage /></ErrorBoundary>} />'
new_route = '<Route path="/pricing" element={<ErrorBoundary><PricingPage /></ErrorBoundary>} />\n            <Route path="/elite-vault" element={<ErrorBoundary><EliteVault /></ErrorBoundary>} />'
content = content.replace(route_str, new_route)

with open('src/App.tsx', 'w') as f:
    f.write(content)
