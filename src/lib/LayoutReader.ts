class Block {
  public tag: string;
  public level: number;
  public pageIdx: number;
  public blockIdx: number;
  public top: number;
  public left: number;
  public bbox: number[];
  public sentences: string[];
  public children: Block[];
  public parent: Block | null;
  public blockJson: any;

  constructor(blockJson: any = null) {
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

  addChild(node: Block): void {
    this.children.push(node);
    node.parent = this;
  }

  public toHtml(
    _includeChildren: boolean = false,
    _recurse: boolean = false
  ): string {
    // Implement as needed
    return "";
  }

  public toText(
    _includeChildren: boolean = false,
    _recurse: boolean = false
  ): string {
    // Implement as needed
    return "";
  }

  parentChain(): Block[] {
    const chain: Block[] = [];
    let parent: Block | null = this.parent;
    while (parent) {
      chain.push(parent);
      parent = parent.parent;
    }
    chain.reverse();
    return chain;
  }

  parentText(): string {
    const parentChain = this.parentChain();
    const headerTexts: string[] = [];
    const paraTexts: string[] = [];

    for (const p of parentChain) {
      if (p.tag === "header") {
        headerTexts.push(p.toText());
      } else if (p.tag === "list_item" || p.tag === "para") {
        paraTexts.push(p.toText());
      }
    }

    let text = headerTexts.join(" > ");

    if (paraTexts.length > 0) {
      text += "\n" + paraTexts.join("\n");
    }
    return text;
  }

  toContextText(includeSectionInfo: boolean = true) {
    let text = "";

    if (includeSectionInfo) {
      text += this.parentText() + "\n";
    }

    if (
      this.tag === "list_item" ||
      this.tag === "para" ||
      this.tag === "table"
    ) {
      text += this.toText(true, true);
    } else {
      this.toText();
    }

    return text;
  }

  iterChildren(
    node: Block,
    level: number,
    nodeVisitor: (node: Block) => void
  ): void {
    for (const child of node.children) {
      nodeVisitor(child);
      if (
        child.tag !== "list_item" &&
        child.tag !== "para" &&
        child.tag !== "table"
      ) {
        this.iterChildren(child, level + 1, nodeVisitor);
      }
    }
  }

  paragraphs(): Block[] {
    const paragraphs: Block[] = [];
    this.iterChildren(this, 0, (node) => {
      if (node.tag === "para") {
        paragraphs.push(node);
      }
    });
    return paragraphs;
  }

  chunks(): Block[] {
    const chunks: Block[] = [];
    this.iterChildren(this, 0, (node) => {
      if (
        node.tag === "para" ||
        node.tag === "list_item" ||
        node.tag === "table"
      ) {
        chunks.push(node);
      }
    });
    return chunks;
  }

  tables(): Block[] {
    const tables: Block[] = [];
    this.iterChildren(this, 0, (node) => {
      if (node.tag === "table") {
        tables.push(node);
      }
    });
    return tables;
  }

  sections(): Block[] {
    const sections: Block[] = [];
    this.iterChildren(this, 0, (node) => {
      if (node.tag === "header") {
        sections.push(node);
      }
    });
    return sections;
  }
}

class Paragraph extends Block {
  constructor(paraJson: any) {
    super(paraJson);
    this.tag = "para";
  }

  public toText(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let paraText = this.sentences.join("\n");
    if (includeChildren) {
      this.children.forEach((child) => {
        paraText +=
          "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
      });
    }
    return paraText;
  }

  public toHtml(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let htmlStr = "<p>";
    htmlStr += this.sentences.join("<br>\n");

    if (includeChildren && this.children.length > 0) {
      htmlStr += "<ul>";
      this.children.forEach((child) => {
        htmlStr += child.toHtml(
          (includeChildren = recurse),
          (recurse = recurse)
        );
      });
      htmlStr += "</ul>";
    }

    htmlStr += "</p>";
    return htmlStr;
  }
}

class Section extends Block {
  public title: string;

  constructor(sectionJson: any) {
    super(sectionJson);
    this.tag = "header";
    this.title = this.sentences.join("\n");
  }

  public toText(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let text = this.title;
    if (includeChildren) {
      this.children.forEach((child) => {
        text +=
          "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
      });
    }
    return text;
  }

  public toHtml(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let htmlStr = `<h${this.level + 1}>${this.title}</h${this.level + 1}>`;

    if (includeChildren) {
      this.children.forEach((child) => {
        htmlStr += child.toHtml(
          (includeChildren = recurse),
          (recurse = recurse)
        );
      });
    }

    return htmlStr;
  }
}

class ListItem extends Block {
  constructor(listJson: any) {
    super(listJson);
    this.tag = "list_item";
  }

  public toText(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let text = this.sentences.join("\n");
    if (includeChildren) {
      this.children.forEach((child) => {
        text +=
          "\n" + child.toText((includeChildren = recurse), (recurse = recurse));
      });
    }
    return text;
  }

  public toHtml(
    includeChildren: boolean = false,
    recurse: boolean = false
  ): string {
    let htmlStr = "<li>";
    htmlStr += this.sentences.join("<br>\n");

    if (includeChildren && this.children.length > 0) {
      htmlStr += "<ul>";
      this.children.forEach((child) => {
        htmlStr += child.toHtml(
          (includeChildren = recurse),
          (recurse = recurse)
        );
      });
      htmlStr += "</ul>";
    }

    htmlStr += "</li>";
    return htmlStr;
  }
}

class TableCell extends Block {
  private colSpan: number;
  private cellValue: any;
  private cellNode: Paragraph | null;

  constructor(cellJson: any) {
    super(cellJson);
    this.tag = "table_cell";
    this.colSpan = cellJson.col_span || 1;
    this.cellValue = cellJson.cell_value;
    this.cellNode =
      typeof cellJson.cell_value !== "string"
        ? new Paragraph(cellJson.cell_value)
        : null;
  }

  public toText(): string {
    return this.cellNode ? this.cellNode.toText() : this.cellValue;
  }

  public toHtml(): string {
    const cellHtml = this.cellNode ? this.cellNode.toHtml() : this.cellValue;
    return `<td${
      this.colSpan > 1 ? ` colspan="${this.colSpan}"` : ""
    }>${cellHtml}</td>`;
  }
}

class TableRow extends Block {
  private cells: TableCell[];

  constructor(rowJson: any) {
    super(rowJson);
    this.cells = [];
    if (rowJson.type === "full_row") {
      const cell = new TableCell(rowJson);
      this.cells.push(cell);
    } else {
      rowJson.cells.forEach((cellJson: any) => {
        const cell = new TableCell(cellJson);
        this.cells.push(cell);
      });
    }
  }

  public toText(): string {
    return this.cells.map((cell) => cell.toText()).join(" | ");
  }

  public toHtml(): string {
    const cellsHtml = this.cells.map((cell) => cell.toHtml()).join("");
    return `<tr>${cellsHtml}</tr>`;
  }
}

class TableHeader extends Block {
  private cells: TableCell[];

  constructor(rowJson: any) {
    super(rowJson);
    this.cells = [];
    if (rowJson.cells) {
      rowJson.cells.forEach((cellJson: any) => {
        const cell = new TableCell(cellJson);
        this.cells.push(cell);
      });
    }
  }

  public toText(): string {
    let cellTexts = this.cells.map((cell) => cell.toText());
    let headerDelim = this.cells.map(() => "---").join(" | ");
    return `${cellTexts.join(" | ")}\n${headerDelim}`;
  }

  public toHtml(): string {
    let cellsHtml = this.cells.map((cell) => cell.toHtml()).join("");
    return `<th>${cellsHtml}</th>`;
  }
}

class Table extends Block {
  private rows: TableRow[];
  private headers: TableHeader[];
  public name: string;

  constructor(tableJson: any, _parent: Block) {
    super(tableJson);
    this.rows = [];
    this.headers = [];
    this.name = tableJson["name"];
    this.tag = "table";
    if ("table_rows" in tableJson) {
      tableJson["table_rows"].forEach((rowJson: any) => {
        if (rowJson["type"] === "table_header") {
          const row = new TableHeader(rowJson);
          this.headers.push(row);
        } else {
          const row = new TableRow(rowJson);
          this.rows.push(row);
        }
      });
    }
  }

  public toText(): string {
    let text = "";
    this.headers.forEach((header) => {
      text += header.toText() + "\n";
    });
    this.rows.forEach((row) => {
      text += row.toText() + "\n";
    });
    return text;
  }

  public toHtml(): string {
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
  debug(pdfRoot: Block): void {
    const iterChildren = (node: Block, level: number) => {
      node.children.forEach((child) => {
        console.log(
          "-".repeat(level) +
            " " +
            child.tag +
            ` (${child.children.length}) ` +
            child.toText()
        );
        iterChildren(child, level + 1);
      });
    };
    iterChildren(pdfRoot, 0);
  }

  read(blocksJson: any[]): Block {
    const root = new Block();
    let parent: Block = root;
    const parentStack: Block[] = [root];
    let prevNode: Block = root;
    let listStack: Block[] = [];
    let node: Block;

    blocksJson.forEach((block) => {
      if (block["tag"] !== "list_item" && listStack.length > 0) {
        listStack = [];
      }

      if (block["tag"] === "para") {
        node = new Paragraph(block);
        parent.addChild(node);
      } else if (block["tag"] === "table") {
        node = new Table(block, prevNode);
        parent.addChild(node);
      } else if (block["tag"] === "list_item") {
        node = new ListItem(block);

        if (prevNode.tag === "para" && prevNode.level === node.level) {
          listStack.push(prevNode);
        } else if (
          prevNode.tag === "list_item" &&
          node.level > prevNode.level
        ) {
          listStack.push(prevNode);
        } else if (
          prevNode.tag === "list_item" &&
          node.level < prevNode.level
        ) {
          while (
            listStack.length > 0 &&
            listStack[listStack.length - 1].level > node.level
          ) {
            listStack.pop();
          }
        }

        if (listStack.length > 0) {
          listStack[listStack.length - 1].addChild(node);
        } else {
          parent.addChild(node);
        }
      } else if (block["tag"] === "header") {
        node = new Section(block);
        if (node.level > parent.level) {
          parentStack.push(parent);
          parent.addChild(node);
        } else {
          while (
            parentStack.length > 1 &&
            parentStack[parentStack.length - 1].level > node.level
          ) {
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
  private reader: LayoutReader;
  public root_node: Block;
  public json: any;

  constructor(blocksJson: any) {
    this.reader = new LayoutReader();
    this.root_node = this.reader.read(blocksJson);
    this.json = blocksJson;
  }

  public chunks(): Block[] {
    return this.root_node.chunks();
  }

  public tables(): Block[] {
    return this.root_node.tables();
  }

  public sections(): Block[] {
    return this.root_node.sections();
  }

  public toText(): string {
    let text = "";
    this.sections().forEach((section) => {
      text += section.toText(true, true) + "\n";
    });
    return text;
  }

  public toHtml(): string {
    let htmlStr = "<html>";
    this.sections().forEach((section) => {
      htmlStr += section.toHtml(true, true);
    });
    htmlStr += "</html>";
    return htmlStr;
  }
}

export { SherpaDocument };
