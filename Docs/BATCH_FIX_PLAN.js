#!/usr/bin/env node
/**
 * Batch Auth Redirect Fix Script
 * 
 * This script documents all files that need auth redirect fixes
 * and the specific changes required for each.
 */

const filesToFix = [
  // === PAGES ===
  {
    file: 'src/pages/TipCall.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/Profile.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/EditProfile.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/CreatePost.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'onClick={() => navigate("/login", { state: { returnUrl: "/create" } })}', to: 'onClick={openLoginModal}' }
    ]
  },
  {
    file: 'src/pages/CompleteProfile.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/PersonalDetails.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/OTPVerification.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' },
      { from: 'onClick={() => navigate("/login")}', to: 'onClick={openLoginModal}' }
    ]
  },
  {
    file: 'src/pages/AdOrders.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/SellerDashboard.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/marketplace/Analysis.tsx',
    imports: `import { useAuthModal } from "../../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/ViewAllProducts.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/ViewAllPosts.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/TipShorts.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'onClick={() => window.location.href = "/login"}', to: 'onClick={openLoginModal}' }
    ]
  },
  {
    file: 'src/pages/AddProduct.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/AddPost.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/pages/AdDashboard.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },

  // === COMPONENTS ===
  {
    file: 'src/components/Wallet.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/components/VideoLoginPrompt.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'onClick={() => navigate("/login")}', to: 'onClick={openLoginModal}' }
    ]
  },
  {
    file: 'src/components/PaidVideoPrompt.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: 'navigate("/login")', to: 'openLoginModal()' }
    ]
  },
  {
    file: 'src/components/EditSellerInfo.tsx',
    imports: `import { useAuthModal } from "../contexts/AuthModalContext";`,
    hookUsage: `const { openLoginModal } = useAuthModal();`,
    replacements: [
      { from: "navigate('/login')", to: 'openLoginModal()' }
    ]
  },
];

console.log('📋 Files requiring auth redirect fixes:', filesToFix.length);
console.log('\nFor each file, you need to:');
console.log('1. Add import statement');
console.log('2. Add hook usage in component');
console.log('3. Replace navigate/window.location calls');

module.exports = filesToFix;
