class Block {
    tag;
    level;
    pageIdx;
    blockIdx;
    top;
    left;
    bbox;
    sentences;
    children;
    parent;
    blockJson;
    constructor(blockJson = null) {
        this.tag = blockJson && "tag" in blockJson ? blockJson["tag"] : null;
        this.level = blockJson && "level" in blockJson ? blockJson["level"] : -1;
        this.pageIdx =
            blockJson && "page_idx" in blockJson ? blockJson["page_idx"] : -1;
        this.blockIdx =
            blockJson && "block_idx" in blockJson ? blockJson["block_idx"] : -1;
        this.top = blockJson && "top" in blockJson ? blockJson["top"] : -1;
        this.left = blockJson && "left" in blockJson ? blockJson["left"] : -1;
        this.bbox = blockJson && "bbox" in blockJson ? blockJson["bbox"] : [];
        this.sentences =
            blockJson && "sentences" in blockJson ? blockJson["sentences"] : [];
        this.children = [];
        this.parent = null;
        this.blockJson = blockJson;
    }
    addChild(node) {
        this.children.push(node);
        node.parent = this;
    }
    toHtml(_includeChildren = false, _recurse = false) {
        return "";
    }
    toText(_includeChildren = false, _recurse = false) {
        return "";
    }
    parentChain() {
        const chain = [];
        let parent = this.parent;
        while (parent) {
            chain.push(parent);
            parent = parent.parent;
        }
        chain.reverse();
        return chain;
    }
    parentText() {
        const parentChain = this.parentChain();
        const headerTexts = [];
        const paraTexts = [];
        for (const p of parentChain) {
            if (p.tag === "header") {
                headerTexts.push(p.toText());
            }
            else if (p.tag === "list_item" || p.tag === "para") {
                paraTexts.push(p.toText());
            }
        }
        let text = headerTexts.join(" > ");
        if (paraTexts.length > 0) {
            text += "\n" + paraTexts.join("\n");
        }
        return text;
    }
    toContextText(includeSectionInfo = true) {
        let text = "";
        if (includeSectionInfo) {
            text += this.parentText() + "\n";
        }
        if (this.tag === "list_item" ||
            this.tag === "para" ||
            this.tag === "table") {
            text += this.toText(true, true);
        }
        else {
            this.toText();
        }
        return text;
    }
    iterChildren(node, level, nodeVisitor) {
        for (const child of node.children) {
            nodeVisitor(child);
            if (child.tag !== "list_item" &&
                child.tag !== "para" &&
                child.tag !== "table") {
                this.iterChildren(child, level + 1, nodeVisitor);
            }
        }
    }
    paragraphs() {
        const paragraphs = [];
        this.iterChildren(this, 0, (node) => {
            if (node.tag === "para") {
                paragraphs.push(node);
            }
        });
        return paragraphs;
    }
    chunks() {
        const chunks = [];
        this.iterChildren(this, 0, (node) => {
            if (node.tag === "para" ||
                node.tag === "list_item" ||
                node.tag === "table") {
                chunks.push(node);
            }
        });
        return chunks;
    }
    tables() {
        const tables = [];
        this.iterChildren(this, 0, (node) => {
            if (node.tag === "table") {
                tables.push(node);
            }
        });
        return tables;
    }
    sections() {
        const sections = [];
        this.iterChildren(this, 0, (node) => {
            if (node.tag === "header") {
                sections.push(node);
            }
        });
        return sections;
    }
}
class Paragraph extends Block {
    constructor(paraJson) {
        super(paraJson);
        this.tag = "para";
    }
    toText(includeChildren = false, recurse = false) {
        let paraText = this.sentences.join("\n");
        if (includeChildren) {
            this.children.forEach((child) => {
                paraText +=
                    "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
            });
        }
        return paraText;
    }
    toHtml(includeChildren = false, recurse = false) {
        let htmlStr = "<p>";
        htmlStr += this.sentences.join("<br>\n");
        if (includeChildren && this.children.length > 0) {
            htmlStr += "<ul>";
            this.children.forEach((child) => {
                htmlStr += child.toHtml((includeChildren = recurse), (recurse = recurse));
            });
            htmlStr += "</ul>";
        }
        htmlStr += "</p>";
        return htmlStr;
    }
}
class Section extends Block {
    title;
    constructor(sectionJson) {
        super(sectionJson);
        this.tag = "header";
        this.title = this.sentences.join("\n");
    }
    toText(includeChildren = false, recurse = false) {
        let text = this.title;
        if (includeChildren) {
            this.children.forEach((child) => {
                text +=
                    "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
            });
        }
        return text;
    }
    toHtml(includeChildren = false, recurse = false) {
        let htmlStr = `<h${this.level + 1}>${this.title}</h${this.level + 1}>`;
        if (includeChildren) {
            this.children.forEach((child) => {
                htmlStr += child.toHtml((includeChildren = recurse), (recurse = recurse));
            });
        }
        return htmlStr;
    }
}
class ListItem extends Block {
    constructor(listJson) {
        super(listJson);
        this.tag = "list_item";
    }
    toText(includeChildren = false, recurse = false) {
        let text = this.sentences.join("\n");
        if (includeChildren) {
            this.children.forEach((child) => {
                text +=
                    "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
            });
        }
        return text;
    }
    toHtml(includeChildren = false, recurse = false) {
        let htmlStr = "<li>";
        htmlStr += this.sentences.join("<br>\n");
        if (includeChildren && this.children.length > 0) {
            htmlStr += "<ul>";
            this.children.forEach((child) => {
                htmlStr += child.toHtml((includeChildren = recurse), (recurse = recurse));
            });
            htmlStr += "</ul>";
        }
        htmlStr += "</li>";
        return htmlStr;
    }
}
class TableCell extends Block {
    colSpan;
    cellValue;
    cellNode;
    constructor(cellJson) {
        super(cellJson);
        this.tag = "table_cell";
        this.colSpan = cellJson.col_span || 1;
        this.cellValue = cellJson.cell_value;
        this.cellNode =
            typeof cellJson.cell_value !== "string"
                ? new Paragraph(cellJson.cell_value)
                : null;
    }
    toText() {
        return this.cellNode ? this.cellNode.toText() : this.cellValue;
    }
    toHtml() {
        const cellHtml = this.cellNode ? this.cellNode.toHtml() : this.cellValue;
        return `<td${this.colSpan > 1 ? ` colspan="${this.colSpan}"` : ""}>${cellHtml}</td>`;
    }
}
class TableRow extends Block {
    cells;
    constructor(rowJson) {
        super(rowJson);
        this.cells = [];
        if (rowJson.type === "full_row") {
            const cell = new TableCell(rowJson);
            this.cells.push(cell);
        }
        else {
            rowJson.cells.forEach((cellJson) => {
                const cell = new TableCell(cellJson);
                this.cells.push(cell);
            });
        }
    }
    toText() {
        return this.cells.map((cell) => cell.toText()).join(" | ");
    }
    toHtml() {
        const cellsHtml = this.cells.map((cell) => cell.toHtml()).join("");
        return `<tr>${cellsHtml}</tr>`;
    }
}
class TableHeader extends Block {
    cells;
    constructor(rowJson) {
        super(rowJson);
        this.cells = [];
        if (rowJson.cells) {
            rowJson.cells.forEach((cellJson) => {
                const cell = new TableCell(cellJson);
                this.cells.push(cell);
            });
        }
    }
    toText() {
        let cellTexts = this.cells.map((cell) => cell.toText());
        let headerDelim = this.cells.map(() => "---").join(" | ");
        return `${cellTexts.join(" | ")}\n${headerDelim}`;
    }
    toHtml() {
        let cellsHtml = this.cells.map((cell) => cell.toHtml()).join("");
        return `<th>${cellsHtml}</th>`;
    }
}
class Table extends Block {
    rows;
    headers;
    name;
    constructor(tableJson, _parent) {
        super(tableJson);
        this.rows = [];
        this.headers = [];
        this.name = tableJson["name"];
        this.tag = "table";
        if ("table_rows" in tableJson) {
            tableJson["table_rows"].forEach((rowJson) => {
                if (rowJson["type"] === "table_header") {
                    const row = new TableHeader(rowJson);
                    this.headers.push(row);
                }
                else {
                    const row = new TableRow(rowJson);
                    this.rows.push(row);
                }
            });
        }
    }
    toText() {
        let text = "";
        this.headers.forEach((header) => {
            text += header.toText() + "\n";
        });
        this.rows.forEach((row) => {
            text += row.toText() + "\n";
        });
        return text;
    }
    toHtml() {
        let htmlStr = "<table>";
        this.headers.forEach((header) => {
            htmlStr += header.toHtml();
        });
        this.rows.forEach((row) => {
            htmlStr += row.toHtml();
        });
        htmlStr += "</table>";
        return htmlStr;
    }
}
class LayoutReader {
    debug(pdfRoot) {
        const iterChildren = (node, level) => {
            node.children.forEach((child) => {
                console.log("-".repeat(level) +
                    " " +
                    child.tag +
                    ` (${child.children.length}) ` +
                    child.toText());
                iterChildren(child, level + 1);
            });
        };
        iterChildren(pdfRoot, 0);
    }
    read(blocksJson) {
        const root = new Block();
        let parent = root;
        const parentStack = [root];
        let prevNode = root;
        let listStack = [];
        let node;
        blocksJson.forEach((block) => {
            if (block["tag"] !== "list_item" && listStack.length > 0) {
                listStack = [];
            }
            if (block["tag"] === "para") {
                node = new Paragraph(block);
                parent.addChild(node);
            }
            else if (block["tag"] === "table") {
                node = new Table(block, prevNode);
                parent.addChild(node);
            }
            else if (block["tag"] === "list_item") {
                node = new ListItem(block);
                if (prevNode.tag === "para" && prevNode.level === node.level) {
                    listStack.push(prevNode);
                }
                else if (prevNode.tag === "list_item" &&
                    node.level > prevNode.level) {
                    listStack.push(prevNode);
                }
                else if (prevNode.tag === "list_item" &&
                    node.level < prevNode.level) {
                    while (listStack.length > 0 &&
                        listStack[listStack.length - 1].level > node.level) {
                        listStack.pop();
                    }
                }
                if (listStack.length > 0) {
                    listStack[listStack.length - 1].addChild(node);
                }
                else {
                    parent.addChild(node);
                }
            }
            else if (block["tag"] === "header") {
                node = new Section(block);
                if (node.level > parent.level) {
                    parentStack.push(parent);
                    parent.addChild(node);
                }
                else {
                    while (parentStack.length > 1 &&
                        parentStack[parentStack.length - 1].level > node.level) {
                        parentStack.pop();
                    }
                    parentStack[parentStack.length - 1].addChild(node);
                    parentStack.push(node);
                }
                parent = node;
            }
            prevNode = node;
        });
        return root;
    }
}
class SherpaDocument {
    reader;
    root_node;
    json;
    constructor(blocksJson) {
        this.reader = new LayoutReader();
        this.root_node = this.reader.read(blocksJson);
        this.json = blocksJson;
    }
    chunks() {
        return this.root_node.chunks();
    }
    tables() {
        return this.root_node.tables();
    }
    sections() {
        return this.root_node.sections();
    }
    toText() {
        let text = "";
        this.sections().forEach((section) => {
            text += section.toText(true, true) + "\n";
        });
        return text;
    }
    toHtml() {
        let htmlStr = "<html>";
        this.sections().forEach((section) => {
            htmlStr += section.toHtml(true, true);
        });
        htmlStr += "</html>";
        return htmlStr;
    }
}
export { SherpaDocument };
//# sourceMappingURL=LayoutReader.js.map