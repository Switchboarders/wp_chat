#!/bin/sh
# Builds the release zip dist/wp-chat-<version>.zip (one top folder "wp-chat", installable from
# Plugins > Add New > Upload) and points the download links at the top of README.md / README.fr.md to it.
#   sh dev/build-zip.sh
set -eu
cd "$(dirname "$0")/.."

version=$(sed -n "s/^define( 'WP_CHAT_VERSION', '\([^']*\)' );/\1/p" wp-chat/wp-chat.php)
header=$(sed -n 's/^ \* Version: *//p' wp-chat/wp-chat.php)
stable=$(sed -n 's/^Stable tag: *//p' wp-chat/readme.txt)
if [ -z "$version" ] || [ "$version" != "$header" ] || [ "$version" != "$stable" ]; then
	echo "Version mismatch: WP_CHAT_VERSION=$version, header=$header, readme.txt Stable tag=$stable" >&2
	exit 1
fi

# The .mo files must match the .po files
for po in wp-chat/languages/*.po; do
	msgfmt -c -o "${po%.po}.mo" "$po" 2>/dev/null || msgfmt -o "${po%.po}.mo" "$po"
done

mkdir -p dist
out="dist/wp-chat-$version.zip"
rm -f "$out"
zip -qr "$out" wp-chat -x "*.DS_Store" "*~"
sed -i "s#dist/wp-chat-[0-9][0-9.]*\.zip#$out#g" README.md README.fr.md
echo "Built $out"
