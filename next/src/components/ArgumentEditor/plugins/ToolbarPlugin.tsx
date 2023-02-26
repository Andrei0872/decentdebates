import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DOMElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  LexicalEditor,
  RangeSelection
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $wrapNodes,
  $isAtNodeEnd
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages
} from "@lexical/code";
import styles from './ToolbarPlugin.module.scss';

const LowPriority = 1;

const supportedBlockTypes = new Set([
  "paragraph",
  "quote",
  "code",
  "h1",
  "h2",
  "ul",
  "ol"
]);

const blockTypeToBlockName = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List"
} as const;
type BlockNames = keyof typeof blockTypeToBlockName;

function Divider() {
  return <div className={styles.divider} />;
}

function positionEditorElement(editor: HTMLElement, rect: DOMRect | null) {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
      }px`;
  }
}

type EditorSelection = ReturnType<typeof $getSelection>;

interface FloatingEditorLinkProps {
  editor: LexicalEditor;
}
function FloatingLinkEditor({ editor }: FloatingEditorLinkProps) {
  const editorRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mouseDownRef = useRef(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<EditorSelection | null>(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection!.anchorNode)
    ) {
      const domRange = nativeSelection!.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner: Element = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      if (!mouseDownRef.current) {
        positionEditorElement(editorElem, rect);
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className={styles.linkEditor}>
      {isEditMode ? (
        <input
          ref={inputRef}
          className={styles.linkInput}
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className={styles.linkInput}>
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkUrl}
            </a>
            <div
              className={styles.linkEdit}
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

interface BProps {
  editor: LexicalEditor;
  blockType: string;
  toolbarRef: React.RefObject<HTMLDivElement>;
  setShowBlockOptionsDropDown: React.Dispatch<React.SetStateAction<boolean>>;
}
function BlockOptionsDropdownList({
  editor,
  blockType,
  toolbarRef,
  setShowBlockOptionsDropDown
}: BProps) {
  const dropDownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${left}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle: EventListener = (event) => {
        const target = event.target as Node;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = () => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div className={styles.dropDown} ref={dropDownRef}>
      <button type="button" className={styles.item} onClick={formatParagraph}>
        <span className={`${styles.icon} ${styles.paragraph}`} />
        <span className={styles.text} >Normal</span>
        {blockType === "paragraph" && <span className={styles.active} />}
      </button>

      <button type="button" className={styles.item} onClick={formatLargeHeading}>
        <span className={`${styles.icon} ${styles.largeHeading}`} />
        <span className={styles.text}>Large Heading</span>
        {blockType === "h1" && <span className={styles.active} />}
      </button>

      <button type="button" className={styles.item} onClick={formatSmallHeading}>
        <span className={`${styles.icon} ${styles.smallHeading}`} />
        <span className={styles.text}>Small Heading</span>
        {blockType === "h2" && <span className={styles.active} />}
      </button>

      <button type="button" className={styles.item} onClick={formatBulletList}>
        <span className={`${styles.icon} ${styles.bulletList}`} />
        <span className={styles.text}>Bullet List</span>
        {blockType === "ul" && <span className={styles.active} />}
      </button>

      <button type="button" className={styles.item} onClick={formatNumberedList}>
        <span className={`${styles.icon} ${styles.numberedList}`} />
        <span className={styles.text}>Numbered List</span>
        {blockType === "ol" && <span className={styles.active} />}
      </button>

      <button type="button" className={styles.item} onClick={formatQuote}>
        <span className={`${styles.icon} ${styles.quote}`} />
        <span className={styles.text}>Quote</span>
        {blockType === "quote" && <span className={styles.active} />}
      </button>
    </div>
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<BlockNames>("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(
    false
  );
  const [codeLanguage, setCodeLanguage] = useState("");
  const [isRTL, setIsRTL] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (Object.hasOwn(blockTypeToBlockName, type)) {
            setBlockType(type as BlockNames);
          }
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }

    // const edState = editor.getEditorState().toJSON();
    // console.log(editor.parseEditorState(edState).toJSON());

    const edState = editor.getEditorState();
    // edState.read(() => {

    // })
    // console.log(edState.toJSON());

    // ~OK
    // console.log(editor.getRootElement());

    // console.log(JSON.stringify(editor.toJSON()));

    // console.log(JSON.stringify(editor.getRootElement()));
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div className={styles.toolbar} ref={toolbarRef}>
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className={`${styles.toolbarItem} ${styles.spaced}`}
        aria-label="Undo"
      >
        <i className={`${styles.format} ${styles.undo}`} />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className={styles.toolbarItem}
        aria-label="Redo"
      >
        <i className={`${styles.format} ${styles.redo}`} />
      </button>
      <Divider />
      {supportedBlockTypes.has(blockType) && (
        <>
          <button
            type="button"
            className={`${styles.toolbarItem} ${styles.blockControls}`}
            onClick={() =>
              setShowBlockOptionsDropDown(!showBlockOptionsDropDown)
            }
            aria-label="Formatting Options"
          >
            <span className={`${styles.icon} ${styles.blockType} ${styles[blockType]}`} />
            <span className={styles.text}>{blockTypeToBlockName[blockType]}</span>
            <i className={styles.chevronDown} />
          </button>
          {showBlockOptionsDropDown &&
            createPortal(
              <BlockOptionsDropdownList
                editor={editor}
                blockType={blockType}
                toolbarRef={toolbarRef}
                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
              />,
              document.body
            )}
          <Divider />
        </>
      )}
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={`${styles.toolbarItem} ${styles.spaced} ${isBold ? styles.active : ''}`}
        aria-label="Format Bold"
      >
        <i className={`${styles.format} ${styles.bold}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={`${styles.toolbarItem} ${styles.spaced} ${isItalic ? styles.active : ''}`}
        aria-label="Format Italics"
      >
        <i className={`${styles.format} ${styles.italic}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={`${styles.toolbarItem} ${styles.spaced} ${isUnderline ? styles.active : ''}`}
        aria-label="Format Underline"
      >
        <i className={`${styles.format} ${styles.underline}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={`${styles.toolbarItem} ${styles.spaced} ${isStrikethrough ? styles.active : ''}`}
        aria-label="Format Strikethrough"
      >
        <i className={`${styles.format} ${styles.strikethrough}`} />
      </button>
      <button
        type="button"
        onClick={insertLink}
        className={`${styles.toolbarItem} ${styles.spaced} ${isLink ? styles.active : ''}`}
        aria-label="Insert Link"
      >
        <i className={`${styles.format} ${styles.link}`} />
      </button>
      {isLink &&
        createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
      <Divider />
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
        className={`${styles.toolbarItem} ${styles.spaced}`}
        aria-label="Left Align"
      >
        <i className={`${styles.format} ${styles.leftAlign}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
        className={`${styles.toolbarItem} ${styles.spaced}`}
        aria-label="Center Align"
      >
        <i className={`${styles.format} ${styles.centerAlign}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
        className={`${styles.toolbarItem} ${styles.spaced}`}
        aria-label="Right Align"
      >
        <i className={`${styles.format} ${styles.rightAlign}`} />
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
        }}
        className={styles.toolbarItem}
        aria-label="Justify Align"
      >
        <i className={`${styles.format} ${styles.justifyAlign}`} />
      </button>{" "}
    </div>
  );
}
