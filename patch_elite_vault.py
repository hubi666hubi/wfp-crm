import re

with open('src/pages/EliteVault.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { toast } from 'sonner';"
new_import = "import { toast } from 'sonner';\nimport { FinanceService } from '../services/FinanceService';"
content = content.replace(import_str, new_import)

# Add speech synth
unlock_str = "toast.success('ELITE VAULT UNLOCKED. PROTOCOL OMEGA INITIATED.', {"
new_unlock = "FinanceService.triggerJarvisVoiceConfirmation('Omega Protocol Initiated. Elite Vault unlocked.');\n    toast.success('ELITE VAULT UNLOCKED. PROTOCOL OMEGA INITIATED.', {"
content = content.replace(unlock_str, new_unlock)

with open('src/pages/EliteVault.tsx', 'w') as f:
    f.write(content)
