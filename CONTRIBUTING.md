# CONTRIBUTING.md - Contribution Guidelines

Thank you for your interest in contributing to the MNIST Digit Classification System! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Coding Standards](#coding-standards)
8. [Documentation](#documentation)

---

## Code of Conduct

Please be respectful and inclusive in all interactions:
- Use professional language
- Be welcoming to new contributors
- Provide constructive feedback
- Report inappropriate behavior

---

## Getting Started

### Prerequisites

- Git
- GitHub account
- Python 3.9+ or Java 17+ (depending on contribution)
- Docker & Docker Compose (for testing)

### Fork & Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR-USERNAME/ML-LABMID.git
cd ML-LABMID

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/ML-LABMID.git
```

---

## Development Setup

### Option 1: Docker Setup (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# Verify services
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Manual Setup

#### Python Service
```bash
cd python-inference-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Spring Boot API
```bash
cd spring-boot-api
mvn clean install
mvn spring-boot:run
```

#### Frontend
Open `frontend/mnist-classifier.html` in browser.

---

## Making Changes

### 1. Create Feature Branch

```bash
# Update main branch
git fetch upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

```
feature/description       # New feature
bugfix/description       # Bug fix
docs/description         # Documentation
refactor/description     # Code refactoring
test/description         # Test additions
```

### 2. Make Your Changes

**For Python Code** (`python-inference-service/`):
- Follow PEP 8 style guide
- Add type hints
- Include docstrings
- Write unit tests

**For Java Code** (`spring-boot-api/`):
- Follow Google Java Style Guide
- Use meaningful variable names
- Add JavaDoc comments
- Write unit tests

**For Frontend Code** (`frontend/`):
- Use consistent indentation (2 spaces)
- Add JSDoc comments
- Test on multiple browsers

**For Documentation** (`docs/`):
- Use clear, concise language
- Include code examples
- Keep formatting consistent
- Update table of contents if needed

### 3. Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions
- `chore`: Build, CI/CD, dependencies

**Examples**:
```
feat(api): add batch prediction endpoint

fix(model): resolve shape mismatch in inference

docs(setup): clarify Docker installation steps

test(service): add unit tests for health check
```

### 4. Keep Branch Updated

```bash
# Fetch latest from upstream
git fetch upstream

# Rebase on latest main
git rebase upstream/main

# If conflicts, resolve them
# Then continue rebase
git rebase --continue
```

---

## Testing

### Python Service Tests

```bash
cd python-inference-service

# Run tests
pytest test_main.py -v

# With coverage
pytest test_main.py --cov=main --cov-report=html
```

### Spring Boot Tests

```bash
cd spring-boot-api

# Run tests
mvn test

# Run specific test
mvn test -Dtest=PredictionControllerTest

# With coverage
mvn clean test jacoco:report
```

### Manual Testing

```bash
# Test endpoints
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{"pixels": [0,0,...,255,...,0]}'

# Check health
curl http://localhost:8000/health
curl http://localhost:8080/health
```

### Frontend Testing

- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Draw various digits and verify predictions
- Test error handling

---

## Submitting Changes

### 1. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 2. Create Pull Request

On GitHub:
1. Click "Compare & Pull Request"
2. Fill in the PR template:
   - **Title**: Brief description
   - **Description**: Detailed explanation
   - **Related Issues**: Link to issues (#123)
   - **Testing**: How you tested changes
   - **Screenshots**: If UI changes

### 3. PR Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Commits are clean and descriptive
- [ ] Branch is up-to-date with main
- [ ] All tests pass locally
- [ ] No debug code or console.log statements

### 4. Address Feedback

- Respond to review comments
- Make requested changes
- Push additional commits (no need to rebase)
- Request re-review

### 5. Merge

Once approved:
- Maintainers will merge your PR
- Your branch will be deleted
- Celebrate! 🎉

---

## Coding Standards

### Python (PEP 8)

```python
# Good
def classify_digit(pixels: List[float]) -> int:
    """
    Classify a digit from pixel array.
    
    Args:
        pixels: Array of 784 pixel values (0-255)
        
    Returns:
        Predicted digit (0-9)
    """
    # Implementation
    pass

# Avoid
def classify(pixels):
    # Implementation
    pass
```

### Java

```java
// Good
public class PredictionService {
    /**
     * Classify digit using ML model.
     *
     * @param request prediction request with pixel data
     * @return prediction response with result
     */
    public PredictionResponse predictDigit(PredictionRequest request) {
        // Implementation
    }
}

// Avoid
public class PredictionService {
    public PredictionResponse predictDigit(PredictionRequest request) {
        // Implementation
    }
}
```

### JavaScript/React

```javascript
// Good
const handleSubmit = async () => {
  setLoading(true);
  try {
    const pixels = getCanvasPixels();
    const response = await fetch('/api/predict', {
      method: 'POST',
      body: JSON.stringify({ pixels })
    });
    const data = await response.json();
    setPrediction(data.prediction);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// Avoid
function handleSubmit() {
  // Complex logic without clear structure
}
```

### Naming Conventions

- **Classes**: PascalCase (`PredictionService`)
- **Functions/Methods**: camelCase (`predictDigit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PIXELS = 784`)
- **Variables**: camelCase (`pixelArray`)
- **Private methods**: Leading underscore in Python (`_internal_method`)

---

## Documentation

### Update Relevant Docs

When making changes, update:

1. **Code comments**: Explain complex logic
2. **Docstrings/JavaDoc**: Document functions/methods
3. **README**: If setup changes
4. **Layer docs**: In `docs/` directory
5. **API docs**: If adding/changing endpoints
6. **CHANGELOG**: Add to unreleased section

### Documentation Format

**Python Docstring**:
```python
def predict(pixels: List[float]) -> int:
    """
    Classify a digit.
    
    Args:
        pixels: 784-element pixel array
        
    Returns:
        Predicted digit (0-9)
        
    Raises:
        ValueError: If pixel array size invalid
    """
```

**Java JavaDoc**:
```java
/**
 * Classify a digit from pixel data.
 *
 * @param request the prediction request
 * @return the prediction response
 * @throws IllegalArgumentException if request invalid
 */
public PredictionResponse predictDigit(PredictionRequest request) {
}
```

### Markdown Style

- Use ATX-style headings (#, ##, ###)
- Code blocks with language specification (```python, ```java)
- Bullet lists for items
- Numbered lists for steps
- Bold for emphasis (**bold**)
- Italics for emphasis (*italic*)

---

## Issue Labels

- `bug`: Bug report
- `enhancement`: Feature request
- `documentation`: Documentation improvement
- `good-first-issue`: Good for new contributors
- `help-wanted`: Extra attention needed
- `question`: Questions/clarifications
- `wontfix`: Will not be fixed

---

## Review Process

### What Reviewers Look For

- ✓ Code quality and style
- ✓ Test coverage
- ✓ Documentation completeness
- ✓ Performance impact
- ✓ Security considerations
- ✓ Backwards compatibility

### Responding to Reviews

- Be open to feedback
- Ask questions if unclear
- Make improvements promptly
- Appreciate the reviewer's time

---

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

---

## Contact

- **Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Email**: [Add contact email]

---

## Additional Resources

- [Git Workflow Guide](https://guides.github.com/introduction/flow/)
- [GitHub Help](https://help.github.com/)
- [PEP 8](https://pep8.org/)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Semantic Versioning](https://semver.org/)

---

Thank you for contributing! 🙏

---

**Last Updated**: April 2025  
**Status**: Active
