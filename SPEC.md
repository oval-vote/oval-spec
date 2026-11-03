# Oval Specification

**Working draft 0.1.** This document specifies Oval, a plain-text file format for voting guides.
It is derived from the data model in `DATA_MODEL.md` and the syntax prototypes in `prototypes/`.
Where this document and the data model disagree, this document is wrong until the disagreement
is resolved deliberately.

The format's name, extension, and media type are given in Section 1.2.

## Contents

1. [Overview](#1-overview)
   1. [Notation](#11-notation)
   2. [Identity](#12-identity)
2. [Language](#2-language)
   1. [Source Text](#21-source-text)
   2. [Lexical Tokens](#22-lexical-tokens)
   3. [Ignored Tokens](#23-ignored-tokens)
   4. [Layout Tokens](#24-layout-tokens)
   5. [Document](#25-document)
   6. [Fields and Blocks](#26-fields-and-blocks)
   7. [Declarations and References](#27-declarations-and-references)
   8. [Guide](#28-guide)
   9. [Party](#29-party)
   10. [Candidate](#210-candidate)
   11. [Ballot](#211-ballot)
   12. [Section](#212-section)
   13. [Contest](#213-contest)
   14. [Campaign](#214-campaign)
   15. [Contest Recommendation](#215-contest-recommendation)
   16. [Measure](#216-measure)
   17. [Measure Recommendation](#217-measure-recommendation)
3. [Validation](#3-validation)
4. [Resolution](#4-resolution)
5. [Conformance](#5-conformance)
- [Appendix A: Grammar Summary](#appendix-a-grammar-summary)
- [Appendix B: Keywords](#appendix-b-keywords)

---

## 1. Overview

An Oval document describes one voting guide: the election it covers, the ballot questions a voter
will face, organized the way the ballot is, and the guide author's recommendation on each question
with the reasoning behind it.

The format is designed to be written by hand by people who are not programmers, to read sensibly
as plain text, and to be strict enough that a validator can catch an unfinished or self-
contradictory guide before it is published.

Oval has three layers, specified in order in this document:

- **The language** (Section 2): what sequences of characters form a well-formed document. A
  document that satisfies Section 2 is *well-formed*. A parser must accept every well-formed
  document and reject every other one.
- **Validation** (Section 3): rules a well-formed document must also satisfy to be *valid*, such
  as "every reference resolves" and "a vote-for-one contest does not recommend a ranking." Some
  rules are errors and some are warnings. A validator reports both.
- **Resolution** (Section 4): how the parsed document becomes the data model's entities, in
  particular how a campaign is identified by one of its candidates.

### 1.1 Notation

Grammar productions are written as

```
Name : Alternative
```

with alternatives on separate lines or separated by `|`. `X?` is optional, `X*` is zero or more,
`X+` is one or more. Literal text is in `backticks`. Token names are in UpperCamelCase. A production
whose name begins with a lowercase letter is a lexical production and matches characters; one that
begins with an uppercase letter is syntactic and matches tokens. `one of` introduces a list of
single-token alternatives.

The complete grammar is collected in Appendix A.

### 1.2 Identity

| | |
|---|---|
| Name | Oval |
| Home | https://oval.vote |
| Source | https://github.com/oval-vote |
| File extension | `.oval` |
| Media type | `text/prs.oval` |
| Encoding | UTF-8 (Section 2.1) |

**File extension.** Oval documents use the extension `.oval`. No other format is known to use it;
it is unclaimed in GitHub Linguist and in file-extension registries. The name Oval is shared with
the Open Vulnerability and Assessment Language, an unrelated XML security standard that does not
use this extension.

**Media type.** The media type is `text/prs.oval`, registered (or to be registered) in the IANA
personal tree under RFC 6838 Section 3.3. The `text/` top-level type is used because an Oval
document is readable without interpreting software (RFC 6838 Section 4.2.1). The personal tree is
used because the format is non-commercial and experimental; it may move to the vendor tree
(`text/vnd.`) if adoption warrants.

The type takes one optional parameter, `charset`, whose only permitted value is `UTF-8`. Oval
documents are always UTF-8 (Section 2.1); the parameter exists to satisfy the requirement that
`text/` registrations state how the character set is determined, and conveys no information. There
is no structured-syntax suffix: Oval is not JSON, XML, or any other registered structured syntax.

The unregistered form `text/x-oval` is not used. RFC 6648 deprecates the `x-` prefix.

**Version marker.** This draft has no in-file version marker. One is under consideration, likely a
first line of the form `oval 1`, so that future parsers can distinguish documents written to
different major versions of this specification. If adopted, it will be a required first line and
will be added to Section 2.5 before the first stable release, since adding it after documents
exist in the wild is costly.

---

## 2. Language

### 2.1 Source Text

An Oval document is a sequence of Unicode code points encoded as UTF-8. A byte order mark, if
present, is ignored.

```
sourceCharacter : any Unicode code point except U+0000
```

A document is divided into *lines* by line terminators.

```
lineTerminator : U+000A
               | U+000D U+000A
               | U+000D
```

All three forms are equivalent. A formatter emits U+000A.

Oval is **layout-sensitive**: the structure of a document is given by the indentation of its lines,
not by brackets or closing keywords. Section 2.4 describes how indentation becomes tokens.

### 2.2 Lexical Tokens

```
Token : Keyword
      | Identifier
      | String
      | Integer
      | Date
      | Url
      | Punctuator
      | MarkdownBlock
```

Tokens are separated by whitespace within a line as necessary. Whitespace is never required
between a `Punctuator` and an adjacent token.

Every byte of the source belongs to exactly one token, counting the ignored tokens of Section 2.3
and an `Error` token for any text that cannot be tokenized. The layout tokens of Section 2.4 are
zero-length. This makes the token stream lossless: concatenating the tokens' text reproduces the
source exactly, which is what allows a formatter to round-trip a document.

#### Keyword

```
Keyword : one of the words listed in Appendix B
```

Keywords are reserved. They are matched case-sensitively and are all lowercase. A word that is not
a keyword and does not begin with `@` is a lexical error; there are no free identifiers in Oval.

#### Identifier

```
Identifier : `@` identifierName
identifierName : identifierStart identifierPart*
identifierStart : letter
identifierPart : letter | digit | `-` | `_`
letter : U+0041–U+005A | U+0061–U+007A
digit : U+0030–U+0039
```

An identifier names an entity. The same token form is used both to declare an identifier and to
refer to one; Section 2.7 explains which is which.

Identifiers are case-sensitive. Two identifiers are the same if their `identifierName` parts are
identical.

#### String

```
String : `"` stringCharacter* `"`
stringCharacter : sourceCharacter but not `"` or `\` or lineTerminator
                | escapedCharacter
escapedCharacter : `\"` | `\\`
```

A string is single-line display text. Only two escapes exist: `\"` for a double quote and `\\`
for a backslash. Strings carry no formatting; all multi-line or formatted text is a
`MarkdownBlock`.

A line terminator or end of input before the closing quote is an *unterminated string*: the text
from the opening quote to the end of the line becomes an `Error` token and lexing resumes on the
next line. A backslash followed by anything other than `"` or `\\` is an *invalid escape*: the
string is still a `String` token, and the error is reported on the two characters of the escape.

#### Integer

```
Integer : digit+
```

An unsigned whole number. Leading zeros are permitted and insignificant. There is no sign.

A word that begins with a digit but is neither an `Integer` nor a `Date` (such as `12abc`,
`3_000`, or `2026-11-5`) is a *malformed number* and becomes one `Error` token.

#### Date

```
Date : digit digit digit digit `-` digit digit `-` digit digit
```

An ISO 8601 calendar date. The lexer and parser match the shape only. Whether the date exists on
the calendar is a validation rule (V13), so `2026-02-30` is a well-formed `Date` and an invalid
document.

#### Url

```
Url : urlScheme `://` urlCharacter+
urlScheme : `https` | `http`
urlCharacter : sourceCharacter but not whitespace or lineTerminator
```

A URL is written bare, without quotes. It extends to the next space, tab, or line terminator, so
`#` and `"` inside a URL are part of it. Only `http` and `https` are permitted. A scheme and `://`
with nothing after them is a *malformed URL* and becomes one `Error` token. Any other word followed
by `://` is lexed as an unknown word, a `:`, and whatever follows.

#### Punctuator

```
Punctuator : one of `:` `,`
```

`:` introduces a `MarkdownBlock` (Section 2.2, below). `,` separates strings in a list.

#### MarkdownBlock

A `MarkdownBlock` is the body of a Markdown field: the lines following a line that ends in a
`Keyword` and `:`.

```
MarkdownBlock : bodyLine+
bodyLine : a line indented strictly more than the opening line, or a blank line between two such lines
```

The *opening line* is any line whose last two tokens, ignoring whitespace and comments, are a
`Keyword` and `:`. After its `Newline`, the lexer looks ahead past any blank lines to the next line
with content. If that line is indented strictly more than the opening line, the body begins there
and extends over every following line that is either blank or indented strictly more than the
opening line, ending after the terminator of the last such line with content. If the next content
line is not indented more, there is no body and no token.

The token covers the body's raw text, from the first content line's leading spaces through the
last content line's terminator (or end of input). Blank lines before and after the body are not part
of it; they lex as `BlankLine`. Blank lines inside the body are part of it. Body lines do not
participate in layout (Section 2.4): they produce no `Newline`, `Indent`, or `Dedent`, and the
indentation stack is unchanged after the body.

The body is **opaque**. Inside it `#` is not a comment, `@`, `"`, and tabs are ordinary characters,
and no other token is recognized. The body is interpreted as Markdown by renderers; this
specification does not define which Markdown constructs are allowed.

The token's *value* is derived from its text by removing the common leading indentation of its
non-blank lines from every line. Parsers expose the value; the token itself keeps the raw text.

A `Keyword` followed by `:` and then anything other than whitespace, a comment, or a line
terminator does not open a body; whether that is valid is the parser's concern. A Markdown field
whose opening line has no body is a syntax error, not a lexical one; omit the field instead.

#### Lexical Errors

Every lexical error has a range. Where the text cannot be tokenized at all it becomes an `Error`
token spanned exactly by one error; where a token is recognizable but flawed, the token keeps its
kind and the error points at the flaw within it. Lexing always continues.

| Error | Range | Token | Recovery |
|---|---|---|---|
| Illegal tab | the run of tabs | `Error` | continue after the tabs |
| Malformed identifier | `@` and the word after it | `Error` | continue after the word |
| Unknown word | the word | `Error` | continue after the word |
| Unexpected character | one character | `Error` | continue after it |
| Unterminated string | opening quote to end of line | `Error` | resume at the line terminator |
| Invalid escape | the backslash and the next character | `String` | continue inside the string |
| Malformed number | the word | `Error` | continue after the word |
| Malformed URL | scheme and `://` | `Error` | continue after `://` |
| Inconsistent dedent | the line's leading spaces | `Whitespace` | treat the line as at the nearest enclosing level (Section 2.4) |

### 2.3 Ignored Tokens

```
Ignored : Comment
        | Whitespace
        | BlankLine
```

```
Comment : `#` commentCharacter* (before lineTerminator)
commentCharacter : sourceCharacter but not lineTerminator
Whitespace : U+0020+
BlankLine : lineTerminator, when the line it ends contains no tokens other than Whitespace and Comment
```

A `#` begins a comment that runs to the end of the line, **except inside a `MarkdownBlock` body or
a `String`**, where it is an ordinary character. A comment may follow tokens on the same line.

A line containing nothing but whitespace and a comment is a *blank line*. Its terminator lexes as
`BlankLine` rather than `Newline`, so blank lines are ignored by the parser wherever they appear.
Inside a `MarkdownBlock` body blank lines are part of the body and separate paragraphs.

Horizontal tab (U+0009) is **not** whitespace. A tab anywhere outside a `String` or `MarkdownBlock`
body is a lexical error. This rule exists so that indentation (Section 2.4) is unambiguous.

### 2.4 Layout Tokens

Oval's block structure is expressed by indentation. The lexer converts indentation into three
synthetic tokens, following the approach of Python.

```
LayoutToken : Newline | Indent | Dedent
```

All three are **zero-length** except `Newline` at a line terminator. `Indent` and `Dedent` are
positioned at the first token of the line that triggers them, after that line's leading
`Whitespace`. Because they have no text, the lossless property of Section 2.2 holds.

A line's *indentation* is the number of U+0020 characters before its first other character. A tab
is an "other character" (and an error, Section 2.3). The lexer maintains a stack of indentation
levels, initially `[0]`.

- At the end of each line with tokens, emit `Newline` covering the line terminator. A blank line
  emits `BlankLine` instead (Section 2.3) and does not affect the stack.
- Before the first token of a line with tokens, compare its indentation `n` to the top of the
  stack:
  - If `n` is greater, push `n` and emit `Indent`.
  - If `n` is less, pop the stack and emit one `Dedent` per level popped until the top is less than
    or equal to `n`. If the top is then not equal to `n`, report an *inconsistent dedent* over the
    line's leading spaces and treat the line as being at the top's level.
  - If `n` is equal, emit nothing.
- At end of input, if the last line has tokens and no terminator, emit a zero-length `Newline`.
  Then emit `Dedent` for every level above 0.

So a block always closes with the sequence `Newline Dedent`, whether it is followed by another
line or by end of input, and the grammar's productions can end in `Newline` without an end-of-input
special case.

The amount of indentation is not fixed; any increase opens a block. A formatter emits two spaces per
level. A line indented more than its predecessor where the grammar does not permit a block is a
syntax error.

Lines inside a `MarkdownBlock` body do not participate in this process; the block is one token
(Section 2.2).

### 2.5 Document

```
Document : GuideField* Declaration* Ballot+
```

A document is a Guide (Section 2.8) written at indentation zero. The document's fields come first,
then any top-level `Party` and `Candidate` declarations, then one or more root `Ballot`s. These
three groups appear in that order; within the first two groups, order is free.

There is no closing token. The document ends at end of input.

### 2.6 Fields and Blocks

Most constructs in Oval are a *header line* followed by an optional *block* of indented lines. The
block holds *fields* and *children*.

```
Block : Indent BlockLine+ Dedent
```

A **field** is a `Keyword` and a value on one line, or a `MarkdownBlock`:

```
StringField(k)   : k String Newline
IntegerField(k)  : k Integer Newline
DateField(k)     : k Date Newline
UrlField(k)      : k Url Newline
RefField(k)      : k Identifier Newline
MarkdownField(k) : k MarkdownBlock
StringListField(k) : k String (`,` String)* Newline
                   | k `none` Newline
```

These are grammar templates: `StringField(subtitle)` means `subtitle String Newline`.

Within one block, **each field keyword may appear at most once**, and **fields may appear in any
order**. A repeated field is a syntax error. **Children** (campaigns within a contest, items within
a ballot) are ordered, and their order is significant. Fields and children may be interleaved; a
formatter places fields first.

A `StringListField` written as `none` denotes an empty list. This is distinct from omitting the
field. Section 2.16 explains where the distinction matters.

A **flag** is a keyword on a header line whose presence means `true`:

```
Flags : Flag*
Flag : one of `incumbent` `withdrawn`
```

There is no `false` spelling; omit the flag.

### 2.7 Declarations and References

Entities (Party, Candidate, Ballot, Contest, Measure) are *declared* exactly once each and may be
*referred to* any number of times.

```
Declaration(k) : k Identifier String
Reference : Identifier
```

A declaration is an `Identifier` **followed immediately by a `String`**, after the entity's
keyword; the string is the entity's name or title. A reference is a bare `Identifier`. This is the
single rule for every entity kind:

```
candidate @jlee "Jordan Lee"     — declares @jlee
campaign @jlee                   — refers to @jlee
campaign @kobi "Kwame Obi"       — declares @kobi here, inline
party @dem "Democratic"          — declares @dem
party @dem                       — refers to @dem
```

Some entities may be declared **inline** at their first use instead of at the top of the
document. Where a reference is permitted, the grammar says whether a declaration is also permitted
in that position. An inline declaration is the same declaration as a top-level one; it is simply
written elsewhere. Validation rule V1 requires every identifier to be declared exactly once in the
document, wherever that is.

Identifiers share one namespace across all entity kinds (V1).

### 2.8 Guide

The Guide is the document. Its fields are written at indentation zero.

```
GuideField : StringField(guide)
           | StringField(election)
           | DateField(date)
           | MarkdownField(note)
```

```
guide "Franklin Voter Guide"
election "November 3, 2026 General Election"
date 2026-11-03

note:
  Written by the Franklin Civic Alliance.
```

`guide`, `election`, and `date` are required (V2). `note` is optional.

```
Declaration : Party | Candidate
```

Top-level declarations follow the guide fields. They are for parties and candidates referenced from
more than one place; anything referenced once may be declared inline instead (Sections 2.10, 2.14).

### 2.9 Party

```
Party : `party` Identifier String Newline PartyBlock?
PartyBlock : Indent PartyField+ Dedent
PartyField : StringField(abbreviation)
           | UrlField(website)
           | MarkdownField(note)
```

```
party @dem "Democratic"
  abbreviation "D"
```

A party may be declared at the top level or inline in a candidate's `party` field (Section 2.10).

### 2.10 Candidate

```
Candidate : `candidate` Identifier String Newline CandidateBlock?
CandidateBlock : Indent CandidateField+ Dedent
CandidateField : StringField(designation)
               | PartyRef
               | MarkdownField(note)
PartyRef : `party` Identifier Newline
         | `party` Identifier String Newline PartyBlock?
```

```
candidate @nreyes "Nadia Reyes"
  designation "United States Senator"
  party @dem
  note:
    Appointed in January 2025 to fill a vacancy.
```

`PartyRef`'s second form is an **inline party declaration**: `party @green "Green"` declares
`@green` right here. It may be followed by a `PartyBlock` indented under it.

A candidate may be declared at the top level, as above, or inline in a campaign (Section 2.14).
Declare at the top level when the person appears in more than one contest.

### 2.11 Ballot

```
Ballot : `ballot` Identifier String Newline BallotBlock
BallotBlock : Indent (BallotField | BallotItem)+ Dedent
BallotField : StringField(eligibility)
            | MarkdownField(note)
BallotItem : Section
           | Contest
           | Measure
           | Ballot
```

```
ballot @franklin "State of Franklin"
  section "Federal Offices"
    ...
  ballot @ashford "City of Ashford"
    eligibility "Registered voters of the City of Ashford"
    ...
```

A ballot is a node in the guide's tree. Its items are in ballot order. A `Ballot` item is a
**sub-ballot**: a narrower electorate whose voters also see everything in the enclosing ballot.
Sub-ballots nest without limit. Document-level ballots are **root ballots**; a document has at
least one.

A ballot with no items is a syntax error (the `BallotBlock` requires at least one line and V12
requires an item).

### 2.12 Section

```
Section : `section` String Newline SectionBlock
SectionBlock : Indent (SectionField | SectionItem)+ Dedent
SectionField : MarkdownField(note)
SectionItem : Contest | Measure
```

A section is a titled group of questions within a ballot, matching a heading on the printed
ballot. It has no identifier and no eligibility meaning. Sections do not nest and do not contain
sub-ballots.

### 2.13 Contest

```
Contest : `contest` Identifier String ContestKind Newline ContestBlock
ContestKind : `single`
            | `multiple` Integer
            | `ranked` (`max` Integer)?
            | `retention`
ContestBlock : Indent (ContestField | Campaign | ContestRecommend)+ Dedent
ContestField : StringField(subtitle)
             | StringField(tabulation)
             | MarkdownField(note)
```

```
contest @mayor "Mayor" ranked max 5
  subtitle "Rank up to five candidates"
  tabulation "Instant runoff; majority of continuing ballots wins"

  campaign incumbent @bsantos "Beatriz Santos"
    designation "Mayor of Ashford"
  campaign @aokafor "Ada Okafor"
    designation "Educator / Nonprofit Director"

  recommend
    support @aokafor
    support @bsantos
    justification:
      ...
```

The contest kind is written on the header line after the title:

| Kind | Meaning | Argument |
|---|---|---|
| `single` | Vote for one. | none |
| `multiple` *n* | Vote for up to *n*; *n* elected. | `Integer`, required, at least 2 (V9) |
| `ranked` | Rank choices. | optional `max` `Integer`: how many may be ranked |
| `retention` | Yes or no on one officeholder. | none |

A contest's block holds its `Campaign`s in ballot order and its `ContestRecommend`s. The grammar
accepts any number of each; validation requires at least one campaign except in a retention
contest (V12) and exactly one recommendation (V10), so that a half-written contest still parses
and the validator can name what is missing. Campaigns and the recommendation may be interleaved
with fields; a formatter places fields, then campaigns, then the recommendation.

### 2.14 Campaign

```
Campaign : `campaign` Flags Member Newline CampaignBlock?
         | `campaign` Flags Newline CampaignBlock
CampaignBlock : Indent (Member Newline MemberBlock? | CampaignField)+ Dedent
Member : Identifier (String)? (`as` String)?
MemberBlock : Indent CandidateField+ Dedent
CampaignField : UrlField(website)
              | MarkdownField(note)
              | StringField(designation)
              | PartyRef
```

A campaign is one or more candidates running together for the contest. It has no identifier; it
is identified by its candidates (Section 4).

A `Member` is a candidate reference (`@id`) or an inline candidate declaration (`@id "Name"`),
optionally followed by `as String`, the member's role on the ticket ("Governor", "Vice President").
A `MemberBlock` holding candidate fields may follow a member **only when the member is an inline
declaration**; a reference has nothing to declare (V3).

The two forms of `Campaign`:

**One-line form.** The single member is on the header line.

```
campaign incumbent @bsantos "Beatriz Santos"
  designation "Mayor of Ashford"
  website https://santosformayor.example
  note:
    Two-term incumbent.
```

In this form the block holds campaign fields *and*, when the member is an inline declaration, the
candidate's `designation` and `party`. The block's `note` is the **campaign's** note. A candidate
note for a one-line campaign requires the block form below. This is a deliberate simplification:
for a single-candidate campaign the reader sees both notes together regardless.

**Block form.** Members are lines in the block, each optionally followed by its own
`MemberBlock` of candidate fields.

```
campaign incumbent
  @jlee "Jordan Lee" as "Governor"
    designation "Governor of Franklin"
    party @dem
    note:
      First-term governor.
  @mpatel "Maya Patel" as "Lieutenant Governor"
    designation "State Senator"
    party @dem
  website https://leepatel2026.example
  note:
    The ticket's note.
```

Member order is significant: the first member is the head of the ticket. In block form,
`designation` and `PartyRef` are not permitted at the campaign level (V4); they belong under a
member.

Flags: `incumbent` means this campaign holds the office being contested; `withdrawn` means the
campaign has ended but remains on the ballot. Both default to false. They may appear in either
order and each at most once.

### 2.15 Contest Recommendation

```
ContestRecommend : `recommend` Newline RecommendBlock
                 | `recommend` `no-position` Newline RecommendNoteBlock?
RecommendBlock : Indent (Support | Oppose | RecommendField)+ Dedent
Support : `support` Reference+ Newline
Oppose : `oppose` Reference+ Newline
RecommendField : MarkdownField(justification)
               | MarkdownField(note)
RecommendNoteBlock : Indent RecommendField+ Dedent
```

```
recommend
  support @aokafor
  support @bsantos @dwright
  oppose @cfox
  justification:
    Okafor is our first choice. Santos and Wright are acceptable in either order.
  note:
    Do not rank Fox.
```

Each `support` line is one **tier**. Several `support` lines are several tiers, in order from most
to least preferred. References within one line are interchangeable. `oppose` lists campaigns the
author advises against; it is unordered and may appear at most once (V5).

Every reference in `support` or `oppose` names a campaign *by one of its candidates* (Section 4).

`recommend no-position` is an explicit statement that the author takes no position. It may carry
`justification` and `note` but no `support` or `oppose`. A `recommend` block with neither `support`
nor `oppose` is a syntax error; write `no-position` instead.

### 2.16 Measure

```
Measure : `measure` Identifier String Newline MeasureBlock
MeasureBlock : Indent (MeasureField | MeasureRecommend)+ Dedent
MeasureField : StringField(subtitle)
             | MarkdownField(description)
             | MarkdownField(if_yes)
             | MarkdownField(if_no)
             | StringField(placement)
             | StringField(tabulation)
             | StringField(fiscal_impact)
             | StringListField(supporters)
             | StringListField(opponents)
             | MarkdownField(note)
```

```
measure @prop1 "Proposition 1"
  subtitle "Affordable Housing Bond"
  description:
    Authorizes $2 billion in general obligation bonds ...
  if_yes:
    The state could sell $2 billion in bonds.
  if_no:
    The state could not sell these bonds.
  placement "Legislative referral"
  tabulation "Simple majority"
  fiscal_impact "About $140 million a year for 30 years"
  supporters "Franklin Housing Coalition", "Franklin Labor Federation"
  opponents none

  recommend yes
    justification:
      ...
```

`description`, `if_yes`, and `if_no` are official ballot text copied verbatim. `supporters` and
`opponents` have three states: **absent** (not researched), **`none`** (researched; none known),
and a list. A measure contains exactly one `MeasureRecommend` (V10).

### 2.17 Measure Recommendation

```
MeasureRecommend : `recommend` MeasurePosition Newline RecommendNoteBlock?
MeasurePosition : one of `yes` `no` `no-position`
```

```
recommend no-position
  justification:
    Two board members recused and the rest were split.
```

---

## 3. Validation

A well-formed document is **valid** if it satisfies every rule marked *error* below. Rules marked
*warning* do not affect validity but a validator must report them. Rule identifiers are stable;
tools report them by identifier.

Where a rule corresponds to a constraint in `DATA_MODEL.md`, the constraint is cited.

### V1 Identifiers — error

Every `Identifier` used as a reference must be declared exactly once somewhere in the document.
Every `Identifier` must be declared at most once. The namespace is shared across all entity kinds:
a candidate and a measure may not share an identifier. A reference must resolve to a declaration
of the kind its position expects: a `party` line names a party, and a member or a `support` or
`oppose` entry names a candidate. (C1, C13)

When a name is declared more than once, the first declaration in source order is the one
references resolve to, and each later declaration is the error.

### V2 Required guide fields — error

`guide`, `election`, and `date` must each be present at the document level. (A repeated field is
already a syntax error under Section 2.6.)

### V3 Member blocks only on declarations — error

A `MemberBlock` may follow a `Member` only when that member is an inline declaration (has a
`String`). A reference followed by an indented block is an error.

### V4 Candidate fields in the right place — error

In block-form campaigns, `designation` and `party` are not permitted at the campaign level. In
one-line campaigns whose member is a reference (not a declaration), `designation` and `party` are
not permitted at all, since the candidate is declared elsewhere.

### V5 Recommendation shape — error

Within a `RecommendBlock`, `oppose` appears at most once. No candidate appears more than once
across all `support` lines and the `oppose` line. (C5)

### V6 Recommendation references are campaigns in this contest — error

Every reference in `support` or `oppose` must resolve (Section 4) to a campaign of the enclosing
contest. (C4)

### V7 One campaign per candidate per contest — error

Within one contest, no candidate may be a member of more than one campaign. (C11)

### V8 No duplicate members — error

Within one campaign, no candidate appears twice. (C2)

### V9 Contest kind arguments — error

`multiple` requires an `Integer` of at least 2. `max` on `ranked`, if present, is at least 1. A
`retention` contest has exactly one campaign. (C9)

### V10 Every question has a recommendation — error

Every `Contest` has exactly one `ContestRecommend`. Every `Measure` has exactly one
`MeasureRecommend`. (C7)

### V11 Kind-specific recommendation rules — error / warning

| Kind | Rule | Severity |
|---|---|---|
| `single` | At most one `support` line. | error |
| `ranked` with `max` *n* | Total candidates across all `support` lines is at most *n*. | error |
| `retention` | At most one `support` line with one reference, or one reference in `oppose`, not both. | error |
| `multiple` *n* | Total candidates across all `support` lines exceeds *n*. | warning |

(C8)

### V12 Ballot structure — error

Every `Ballot` has at least one item, not counting fields. Every `Section` has at least one item.
Every `Contest` whose kind is not `retention` has at least one campaign; a retention contest's
campaign count is governed by V9. (C17)

### V13 Dates — error

`date` exists on the proleptic Gregorian calendar: the month is 1 through 12 and the day is within
that month's length, with 29 February allowed only in leap years.

### V14 Unused declarations — warning

A top-level `Party` declaration that no `party` line refers to. A top-level `Candidate` declaration
that is a member of no campaign. Inline declarations are used by the construct that declares them
and are never reported. (C10, C20)

### V15 Duplicate party names — warning

Two `Party` declarations with the same `name` and different identifiers. (C20)

### V16 Suspicious ballots — warning

Sibling ballots, or root ballots, with identical titles. (C18)

### V17 Head-of-ticket references — warning

A `support` or `oppose` reference that names a member of a multi-member campaign other than its
first member. The reference resolves correctly; the warning is stylistic. (C12)

### V18 Paired yes/no statements — warning

A `Measure` with exactly one of `if_yes` and `if_no`. (C14)

---

## 4. Resolution

Resolution turns the parsed document into the entities of `DATA_MODEL.md`.

### 4.1 Declarations

Each `Declaration` and each inline declaration produces one entity with the given identifier and
name. The position of the declaration in the document has no effect on the entity, except that an
inline candidate declaration also makes that candidate a member of the enclosing campaign, and an
inline party declaration also sets the enclosing candidate's `party`.

### 4.2 Campaign identity

Campaigns have no identifiers. A reference in a `ContestRecommend` is a **candidate** identifier.
It resolves to the one campaign, among the enclosing contest's campaigns, whose members include
that candidate. V7 guarantees there is at most one; V6 requires there to be exactly one.

### 4.3 Fields

Each field sets the corresponding attribute of the enclosing entity. A one-line campaign's
`designation` and `party` set attributes of its (inline-declared) candidate; its other fields set
attributes of the campaign. In block form, a `MemberBlock`'s fields set attributes of that member's
candidate.

### 4.4 Markdown

`MarkdownBlock` values are passed through unchanged. Interpreting them is the renderer's
responsibility.

---

## 5. Conformance

Three conformance levels are defined so that tools can claim what they implement.

- **Lexer-conformant.** Tokenizes any input per Sections 2.2–2.4, producing tokens that cover
  every byte, and reports lexical errors with the ranges and recovery of Section 2.2. Sufficient
  for syntax highlighting.
- **Parser-conformant.** Accepts exactly the well-formed documents of Section 2 and produces a
  tree from which Section 4 can be applied. Sufficient for a formatter.
- **Validator-conformant.** Parser-conformant, and reports every Section 3 rule with its
  identifier and severity.

A conformance test suite (not yet written) will consist of well-formed and malformed documents,
and for each well-formed document the expected validation report and canonical resolved output.

---

## Appendix A: Grammar Summary

Lexical productions match characters; syntactic productions match tokens. Layout tokens
(`Newline`, `Indent`, `Dedent`) are produced as described in Section 2.4.

```
— Lexical —

sourceCharacter  : any Unicode code point except U+0000
lineTerminator   : U+000A | U+000D U+000A | U+000D

Token            : Keyword | Identifier | String | Integer | Date | Url | Punctuator | MarkdownBlock
Ignored          : Comment | Whitespace | BlankLine
LayoutToken      : Newline | Indent | Dedent          — zero-length except Newline at a terminator

Keyword          : one of (Appendix B)
Identifier       : `@` identifierName
identifierName   : identifierStart identifierPart*
identifierStart  : letter
identifierPart   : letter | digit | `-` | `_`
letter           : U+0041–U+005A | U+0061–U+007A
digit            : U+0030–U+0039
String           : `"` stringCharacter* `"`
stringCharacter  : sourceCharacter but not `"` or `\` or lineTerminator | escapedCharacter
escapedCharacter : `\"` | `\\`
Integer          : digit+
Date             : digit digit digit digit `-` digit digit `-` digit digit
Url              : urlScheme `://` urlCharacter+
urlScheme        : `https` | `http`
urlCharacter     : sourceCharacter but not whitespace or lineTerminator
Punctuator       : one of `:` `,`
MarkdownBlock    : bodyLine+                           — see 2.2; opened by a line ending `Keyword :`
Comment          : `#` commentCharacter*
commentCharacter : sourceCharacter but not lineTerminator
Whitespace       : U+0020+
BlankLine        : lineTerminator ending a line with no tokens but Whitespace and Comment

— Field templates —

StringField(k)     : k String Newline
IntegerField(k)    : k Integer Newline
DateField(k)       : k Date Newline
UrlField(k)        : k Url Newline
MarkdownField(k)   : k MarkdownBlock
StringListField(k) : k String (`,` String)* Newline | k `none` Newline
Flags              : Flag*
Flag               : one of `incumbent` `withdrawn`
Reference          : Identifier

— Document —

Document         : GuideField* Declaration* Ballot+
GuideField       : StringField(guide) | StringField(election) | DateField(date) | MarkdownField(note)
Declaration      : Party | Candidate

Party            : `party` Identifier String Newline PartyBlock?
PartyBlock       : Indent PartyField+ Dedent
PartyField       : StringField(abbreviation) | UrlField(website) | MarkdownField(note)

Candidate        : `candidate` Identifier String Newline CandidateBlock?
CandidateBlock   : Indent CandidateField+ Dedent
CandidateField   : StringField(designation) | PartyRef | MarkdownField(note)
PartyRef         : `party` Identifier Newline
                 | `party` Identifier String Newline PartyBlock?

Ballot           : `ballot` Identifier String Newline BallotBlock
BallotBlock      : Indent (BallotField | BallotItem)+ Dedent
BallotField      : StringField(eligibility) | MarkdownField(note)
BallotItem       : Section | Contest | Measure | Ballot

Section          : `section` String Newline SectionBlock
SectionBlock     : Indent (SectionField | SectionItem)+ Dedent
SectionField     : MarkdownField(note)
SectionItem      : Contest | Measure

Contest          : `contest` Identifier String ContestKind Newline ContestBlock
ContestKind      : `single` | `multiple` Integer | `ranked` (`max` Integer)? | `retention`
ContestBlock     : Indent (ContestField | Campaign | ContestRecommend)+ Dedent
ContestField     : StringField(subtitle) | StringField(tabulation) | MarkdownField(note)

Campaign         : `campaign` Flags Member Newline CampaignBlock?
                 | `campaign` Flags Newline CampaignBlock
CampaignBlock    : Indent (Member Newline MemberBlock? | CampaignField)+ Dedent
Member           : Identifier String? (`as` String)?
MemberBlock      : Indent CandidateField+ Dedent
CampaignField    : UrlField(website) | MarkdownField(note) | StringField(designation) | PartyRef

ContestRecommend : `recommend` Newline RecommendBlock
                 | `recommend` `no-position` Newline RecommendNoteBlock?
RecommendBlock   : Indent (Support | Oppose | RecommendField)+ Dedent
Support          : `support` Reference+ Newline
Oppose           : `oppose` Reference+ Newline
RecommendField   : MarkdownField(justification) | MarkdownField(note)
RecommendNoteBlock : Indent RecommendField+ Dedent

Measure          : `measure` Identifier String Newline MeasureBlock
MeasureBlock     : Indent (MeasureField | MeasureRecommend)+ Dedent
MeasureField     : StringField(subtitle) | MarkdownField(description) | MarkdownField(if_yes)
                 | MarkdownField(if_no) | StringField(placement) | StringField(tabulation)
                 | StringField(fiscal_impact) | StringListField(supporters)
                 | StringListField(opponents) | MarkdownField(note)

MeasureRecommend : `recommend` MeasurePosition Newline RecommendNoteBlock?
MeasurePosition  : one of `yes` `no` `no-position`
```

## Appendix B: Keywords

All keywords are reserved in every position.

| Group | Keywords |
|---|---|
| Document | `guide` `election` `date` `note` |
| Entities | `party` `candidate` `ballot` `section` `contest` `campaign` `measure` |
| Party fields | `abbreviation` `website` |
| Candidate fields | `designation` |
| Ballot fields | `eligibility` |
| Contest header | `single` `multiple` `ranked` `retention` `max` |
| Contest fields | `subtitle` `tabulation` |
| Campaign | `incumbent` `withdrawn` `as` |
| Recommendation | `recommend` `support` `oppose` `justification` `yes` `no` `no-position` |
| Measure fields | `description` `if_yes` `if_no` `placement` `tabulation` `fiscal_impact` `supporters` `opponents` |
| Values | `none` |
