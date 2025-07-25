# Contributing to OpenWrite

Thank you for your interest in contributing to OpenWrite! This guide will help you get started with development and understand our contribution process.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) v1.2.19 or later
- [Node.js](https://nodejs.org/) v18+ (for some build tools)
- [Git](https://git-scm.com/)

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/openwrite.git
cd openwrite

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp apps/server/.env.example apps/server/.env
# Edit .env with your API keys and configuration

# 4. Initialize the database
bun db:push

# 5. Start development servers
bun dev
```

Visit:
- **Web App**: `http://localhost:3001`
- **API**: `http://localhost:3000`  
- **Documentation**: `http://localhost:5173` (if running docs dev)

## 🏗️ Project Structure

```
openwrite/
├── apps/
│   ├── web/           # React frontend with TanStack Router
│   ├── server/        # Hono API with REST endpoints
│   └── docs/          # VitePress documentation
├── packages/          # Shared packages (future)
└── tooling/           # Development tools (future)
```

## 📋 How to Contribute

### 1. **Find an Issue**
- Browse [GitHub Issues](https://github.com/ilrein/openwrite/issues)
- Check the [GitHub Project Board](https://github.com/users/ilrein/projects/2)
- Look for issues labeled `good first issue` or `help wanted`

### 2. **Create a Branch**
```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. **Development Process**
- Write clean, well-documented code
- Follow our coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 4. **Submit a Pull Request**
- Push your branch to your fork
- Open a PR with a clear title and description
- Link to relevant issues
- Wait for code review and feedback

## 🎨 Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use TypeScript for all props and state

### Backend
- Use REST APIs for all API endpoints
- Validate all inputs with Zod schemas
- Follow RESTful conventions where applicable
- Handle errors gracefully

### Database
- Use Drizzle ORM for all database operations
- Create proper migrations for schema changes
- Add indexes for query performance
- Follow naming conventions

## 🧪 Testing

```bash
# Run type checking
bun check-types

# Run tests (when implemented)
bun test

# Run linting
bun lint
```

## 📖 Documentation

When contributing, please:
- Update relevant documentation in `/apps/docs/`
- Add JSDoc comments to new functions
- Update API documentation for endpoint changes
- Include examples in your documentation

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment information (OS, browser, etc.)
- Screenshots or videos if applicable

## 💡 Feature Requests

For new features:
- Check existing issues first
- Provide clear use cases
- Consider backwards compatibility
- Discuss technical approach
- Consider plugin architecture for extensions

## 🔄 Development Workflow

1. **Planning**: Discuss major changes in issues first
2. **Development**: Work on focused, atomic changes
3. **Review**: All code goes through peer review
4. **Testing**: Ensure all tests pass
5. **Documentation**: Update docs as needed
6. **Deployment**: Maintainers handle releases

## 📚 Additional Resources

- [Architecture Overview](./architecture.md) - Technical implementation details
- [Project Setup Guide](./project-setup.md) - GitHub project management
- [Database Schema](./database.md) - Data models and relationships
- [API Reference](/api/) - Complete API documentation

## 🤝 Community

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community (coming soon)
- **Issues**: Report bugs and request features
- **Pull Requests**: Contribute code and documentation

## 📝 License

By contributing to OpenWrite, you agree that your contributions will be licensed under the [AGPLv3 License](https://github.com/ilrein/openwrite/blob/main/LICENSE).

---

**Happy Contributing! 🎉**

We appreciate every contribution, whether it's code, documentation, bug reports, or feature suggestions. Together, we're building the future of AI-powered creative writing!