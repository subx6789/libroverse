# Contributing to LibroVerse

Thank you for your interest in contributing to **LibroVerse**! We welcome contributions from developers, designers, writers, and book enthusiasts of all skill levels.

---

## 📋 Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it to understand the community standards.

---

## 🛠️ How to Contribute

### 1. Reporting Bugs
- Check the existing GitHub Issues to see if the issue has already been reported.
- If not, create a new issue using our **Bug Report Template**.
- Provide clear steps to reproduce, expected vs. actual behavior, and environment details (browser, Node version).

### 2. Suggesting Enhancements
- Open a feature request issue using our **Feature Request Template**.
- Describe the motivation, problem it solves, and proposed solution.

### 3. Submitting Pull Requests
1. **Fork the repository** and clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/libroverse.git
   cd libroverse
   ```
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```
3. **Install dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. **Make your changes**:
   - Keep functions focused and readable.
   - Follow clean TypeScript type standards without `any`.
   - Validate any new inputs using Zod schemas.
5. **Verify builds**:
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```
6. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat(community): add feature description"
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request** against the `main` branch with a clear description of the changes.

---

## 📐 Coding Conventions

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Zustand stores.
- **Backend:** Node.js, Express 5, TypeScript, Mongoose models, Zod validation.
- **Commit Messages:** Follow standard conventional commit prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

---

## 📄 License
By contributing to LibroVerse, you agree that your contributions will be licensed under its [MIT License](./LICENSE).
