#!/bin/bash
# Run a JS file inside the open Taskfolio tab in Google Chrome (macOS) and print the result.
# usage: tf.sh <file.js> [tab-url-substring]   (default substring: "taskfolio")
# Escape non-ASCII as \uXXXX inside the JS file.
# Chrome must allow it: View > Developer > Allow JavaScript from Apple Events.
[ -f "$1" ] || { echo "usage: tf.sh <file.js> [tab-url-substring]"; exit 2; }
MATCH="${2:-taskfolio}"
osascript -l JavaScript -e "
const app=Application('Google Chrome');
const js=$(python3 -c 'import json,sys;print(json.dumps(open(sys.argv[1]).read()))' "$1");
const m=$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$MATCH");
let r='NO TASKFOLIO TAB';
app.windows().forEach(w=>w.tabs().forEach(t=>{if(t.url().includes(m))r=t.execute({javascript:js});}));
r"
