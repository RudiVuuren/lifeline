#!/usr/bin/env python3
"""Check a Lifeline diagram and print a link that opens it.

Usage:
    python lifeline.py diagram.yaml            # check, then print a compressed #z= link
    python lifeline.py diagram.yaml --yaml     # print a #yaml= link instead
    python lifeline.py diagram.yaml --check    # check only

Exits with status 1 if the diagram has errors. Needs PyYAML (pip install pyyaml).
"""
import base64
import re
import sys
import urllib.parse
import zlib

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

APP = "https://rudivuuren.github.io/lifeline/open/"
TYPES = {"participant", "actor", "database", "queue", "external"}
KINDS = {"sync", "reply"}
COLORS = {"blue", "green", "orange", "red", "purple", "teal", "gray"}
ID_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


def check(doc):
    errors, warnings = [], []
    if not isinstance(doc, dict):
        return ["The top level must be a mapping with title and flows."], warnings
    if "root" in doc:
        errors.append("Remove the 'root' key; all flows are peers.")
    flows = doc.get("flows")
    if not isinstance(flows, dict) or not flows:
        return errors + ["'flows' must be a non-empty mapping of flow ids to flows."], warnings
    linked = set()
    for fid, f in flows.items():
        where = f"flow '{fid}'"
        if not ID_RE.match(str(fid)):
            errors.append(f"{where}: id uses characters other than letters, digits, '.', '-' and '_'.")
        if not isinstance(f, dict):
            errors.append(f"{where} must be a mapping.")
            continue
        parts = f.get("participants") or []
        msgs = f.get("messages") or []
        if not isinstance(parts, list) or not isinstance(msgs, list):
            errors.append(f"{where}: 'participants' and 'messages' must be lists.")
            continue
        pids = set()
        for p in parts:
            pid = str(p.get("id", "")) if isinstance(p, dict) else ""
            if not pid or not ID_RE.match(pid):
                errors.append(f"{where}: participant {p!r} needs a valid id.")
                continue
            if pid in pids:
                errors.append(f"{where}: participant id '{pid}' is used twice.")
            pids.add(pid)
            if p.get("type", "participant") not in TYPES:
                errors.append(f"{where}/{pid}: type must be one of {sorted(TYPES)}.")
            if "badges" in p:
                errors.append(f"{where}/{pid}: badges are only allowed on messages.")
            if p.get("link"):
                linked.add(p["link"])
                if p["link"] not in flows:
                    errors.append(f"{where}/{pid}: link '{p['link']}' is not a flow id.")
                elif p["link"] == fid:
                    errors.append(f"{where}/{pid}: a flow must not link to itself.")
        mids = set()
        for i, m in enumerate(msgs, 1):
            if not isinstance(m, dict):
                errors.append(f"{where}: message {i} must be a mapping.")
                continue
            mid = str(m.get("id", f"#{i}"))
            here = f"{where}/{mid}"
            if mid in mids:
                errors.append(f"{here}: message id is used twice.")
            mids.add(mid)
            for end in ("from", "to"):
                if str(m.get(end, "")) not in pids:
                    errors.append(f"{here}: '{end}: {m.get(end)}' is not a participant id in this flow.")
            kind = m.get("kind", "sync")
            if kind == "async":
                warnings.append(f"{here}: kind 'async' is deprecated; use sync (omit kind) or reply.")
            elif kind not in KINDS:
                errors.append(f"{here}: kind must be 'sync' (or omitted) or 'reply'.")
            if m.get("link"):
                linked.add(m["link"])
                if m["link"] not in flows:
                    errors.append(f"{here}: link '{m['link']}' is not a flow id.")
                elif m["link"] == fid:
                    errors.append(f"{here}: a flow must not link to itself.")
            badges = m.get("badges") or []
            if not isinstance(badges, list):
                errors.append(f"{here}: 'badges' must be a list.")
                continue
            for b in badges:
                if not isinstance(b, dict) or not b.get("name"):
                    errors.append(f"{here}: every badge needs a name.")
                    continue
                name, btype = str(b["name"]), b.get("type", "text")
                if btype not in ("text", "yaml"):
                    errors.append(f"{here} badge '{name}': type must be text or yaml.")
                color = str(b.get("color", "gray"))
                if color not in COLORS and not re.match(r"^#[0-9a-fA-F]{3,8}$", color):
                    errors.append(f"{here} badge '{name}': colour must be one of {sorted(COLORS)}.")
                if btype == "yaml" and b.get("content"):
                    try:
                        yaml.safe_load(str(b["content"]))
                    except yaml.YAMLError as e:
                        errors.append(f"{here} badge '{name}': content is not valid YAML ({e.problem}).")
                if name in ("request", "response") and btype != "yaml":
                    warnings.append(f"{here} badge '{name}': payload badges should be type yaml.")
                if len(name) > 24:
                    warnings.append(f"{here} badge '{name}': long names are shortened on the diagram.")
            if len(badges) > 4:
                warnings.append(f"{here}: more than 4 badges; consider moving detail to notes.")
        if len(parts) > 8 or len(msgs) > 15:
            warnings.append(f"{where}: {len(parts)} participants and {len(msgs)} steps; consider splitting it.")
    first = next(iter(flows))
    for fid in flows:
        if fid != first and fid not in linked:
            warnings.append(f"flow '{fid}' is not linked from any other flow.")
    return errors, warnings


def z_link(text):
    c = zlib.compressobj(9, zlib.DEFLATED, -15)
    data = c.compress(text.encode("utf-8")) + c.flush()
    return APP + "#z=" + base64.urlsafe_b64encode(data).decode().rstrip("=")


def yaml_link(text):
    return APP + "#yaml=" + urllib.parse.quote(text, safe="")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    text = open(args[0], encoding="utf-8").read()
    try:
        doc = yaml.safe_load(text)
    except yaml.YAMLError as e:
        sys.exit(f"Not valid YAML: {e}")
    errors, warnings = check(doc)
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    for e in errors:
        print(f"error: {e}", file=sys.stderr)
    if errors:
        sys.exit(1)
    if "--check" in sys.argv:
        print("OK")
        return
    link = yaml_link(text) if "--yaml" in sys.argv else z_link(text)
    print(link)
    if len(link) > 8000:
        print(f"warning: the link is {len(link):,} characters; some chat apps cut long links. "
              "Share the .yaml file too.", file=sys.stderr)


if __name__ == "__main__":
    main()
