// Lightweight Code Syntax Highlighter
const CodeHighlighter = {
    // Language-specific keywords and patterns
    languages: {
        javascript: {
            keywords: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|import|export|from|default|async|await|yield|this|super|static|get|set|typeof|instanceof|void|delete|in|of)\b/g,
            strings: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
            comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
            numbers: /\b(\d+\.?\d*|\.\d+)\b/g,
        },
        python: {
            keywords: /\b(def|class|if|elif|else|for|while|try|except|finally|with|as|import|from|return|yield|lambda|pass|break|continue|raise|assert|del|global|nonlocal|True|False|None|and|or|not|in|is)\b/g,
            strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
            comments: /#.*$/gm,
            functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
            numbers: /\b(\d+\.?\d*|\.\d+)\b/g,
        },
        java: {
            keywords: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|void|int|long|double|float|boolean|char|byte|short|String|true|false|null|this|super)\b/g,
            strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
            comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
            numbers: /\b(\d+\.?\d*|\.\d+)\b/g,
        },
        cpp: {
            keywords: /\b(auto|bool|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|extern|false|float|for|friend|goto|if|inline|int|long|namespace|new|nullptr|operator|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|while)\b/g,
            strings: /(["'])(?:(?=(\\?))\2.)*?\1/g,
            comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
            functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
            numbers: /\b(\d+\.?\d*|\.\d+)\b/g,
        },
        html: {
            tags: /(&lt;\/?[a-zA-Z][a-zA-Z0-9]*[^&]*?&gt;)/g,
            attrNames: /\b([a-zA-Z-]+)=/g,
            attrValues: /=\s*(["'])(?:(?=(\\?))\2.)*?\1/g,
            comments: /(&lt;!--[\s\S]*?--&gt;)/g,
        },
        css: {
            keywords: /\b(important|inherit|initial|unset|auto|none)\b/g,
            selectors: /^[\s]*[.#]?[a-zA-Z][a-zA-Z0-9_-]*/gm,
            properties: /\b([a-zA-Z-]+)(?=\s*:)/g,
            values: /:\s*([^;{}\n]+)/g,
            comments: /(\/\*[\s\S]*?\*\/)/g,
        },
        json: {
            keys: /"([^"]+)"(?=\s*:)/g,
            strings: /:\s*(["'])(?:(?=(\\?))\2.)*?\1/g,
            numbers: /:\s*(\d+\.?\d*|\.\d+)/g,
            booleans: /\b(true|false|null)\b/g,
        }
    },

    // Highlight code based on language
    highlight(code, language) {
        if (!language || language === 'text' || language === 'plain') {
            return this.escapeHtml(code);
        }

        let highlighted = this.escapeHtml(code);
        const lang = this.languages[language.toLowerCase()];

        if (!lang) {
            return highlighted;
        }

        const protectedTokens = [];
        const protect = (value, className) => {
            const token = `@@CODETOKEN_${protectedTokens.length}@@`;
            protectedTokens.push({ token, html: `<span class="${className}">${value}</span>` });
            return token;
        };

        // Protect comments and strings first so later regexes do not highlight inside injected span markup.
        if (lang.comments) {
            highlighted = highlighted.replace(lang.comments, match => protect(match, 'code-comment'));
        }

        if (lang.strings) {
            highlighted = highlighted.replace(lang.strings, match => protect(match, 'code-string'));
        }

        if (lang.keywords) {
            highlighted = highlighted.replace(lang.keywords, '<span class="code-keyword">$1</span>');
        }

        if (lang.functions) {
            highlighted = highlighted.replace(lang.functions, '<span class="code-function">$1</span>');
        }

        if (lang.numbers) {
            highlighted = highlighted.replace(lang.numbers, '<span class="code-number">$&</span>');
        }

        // HTML/XML specific - use placeholders to avoid re-processing
        if (lang.tags || lang.attrNames || lang.attrValues) {
            const htmlPlaceholders = [];
            
            // Match entire HTML tags and replace with placeholders
            highlighted = highlighted.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)([^&]*?)(&gt;)/g, 
                (match, openBracket, tagName, middle, closeBracket) => {
                    const placeholder = `{{HTML_TAG_${htmlPlaceholders.length}}}`;
                    
                    // Build the highlighted version
                    let tagHtml = openBracket + `<span class="code-tag">${tagName}</span>`;
                    
                    // Process attributes in middle part
                    if (middle.trim()) {
                        const processedMiddle = middle.replace(/([a-zA-Z-]+)(=)(["']?)([^"'\s&>]*)(["']?)/g, 
                            (m, attrName, equals, quote1, attrValue, quote2) => {
                                if (!attrName) return m;
                                let result = `<span class="code-attr-name">${attrName}</span>${equals}`;
                                if (quote1 || quote2 || attrValue) {
                                    result += `<span class="code-attr-value">${quote1}${attrValue}${quote2}</span>`;
                                }
                                return result;
                            }
                        );
                        tagHtml += processedMiddle;
                    }
                    
                    tagHtml += closeBracket;
                    htmlPlaceholders.push(tagHtml);
                    return placeholder;
                }
            );
            
            // Restore HTML tag placeholders
            htmlPlaceholders.forEach((html, index) => {
                highlighted = highlighted.replace(`{{HTML_TAG_${index}}}`, html);
            });
        }

        // CSS specific
        if (lang.properties) {
            highlighted = highlighted.replace(lang.properties, '<span class="code-attr-name">$1</span>');
        }

        // JSON specific
        if (lang.keys) {
            highlighted = highlighted.replace(lang.keys, '<span class="code-attr-name">"$1"</span>');
        }

        if (lang.booleans) {
            highlighted = highlighted.replace(lang.booleans, '<span class="code-keyword">$&</span>');
        }

        protectedTokens.forEach((entry) => {
            highlighted = highlighted.replace(entry.token, entry.html);
        });

        return highlighted;
    },

    // Escape HTML entities
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Parse code blocks from markdown-style text
    parseCodeBlocks(text) {
        // Match ```language\ncode\n``` or ```language code```
        const codeBlockRegex = /```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g;
        
        return text.replace(codeBlockRegex, (match, language, code) => {
            const lang = language || 'text';
            const highlighted = this.highlight(code.trim(), lang);
            const blockId = 'code-' + Math.random().toString(36).substr(2, 9);
            
            return `<div class="code-block-container">
                <div class="code-block-header">
                    <span class="code-block-language">${this.escapeHtml(lang)}</span>
                    <button class="code-block-copy" data-action="copy-code" data-code-id="${blockId}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div class="code-block-content">
                    <pre><code id="${blockId}">${highlighted}</code></pre>
                </div>
            </div>`;
        });
    },

    // Parse inline code
    parseInlineCode(text) {
        // Match `code` but not inside code blocks
        return text.replace(/`([^`]+)`/g, '<code>$1</code>');
    }
};

// Copy code block function
function copyCodeBlock(blockId) {
    const codeElement = document.getElementById(blockId);
    if (!codeElement) return;

    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const button = codeElement.closest('.code-block-container').querySelector('.code-block-copy');
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}


document.addEventListener('click', (e) => {
    const btn = e.target.closest('.code-block-copy[data-action="copy-code"]');
    if (!btn) return;
    const codeId = btn.getAttribute('data-code-id');
    if (codeId) copyCodeBlock(codeId);
});
// Make it globally available
if (typeof window !== 'undefined') {
    window.CodeHighlighter = CodeHighlighter;
    window.copyCodeBlock = copyCodeBlock;
}

