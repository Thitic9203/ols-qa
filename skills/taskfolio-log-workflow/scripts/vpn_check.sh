#!/bin/bash
# Prints VPN_ON (with detail) or VPN_OFF (macOS). Taskfolio must be used with the VPN off.
on=$(scutil --nc list | grep -E '^\* \(Connected\)')
if [ -n "$on" ] || ifconfig 2>/dev/null | grep -A3 '^utun' | grep -q 'inet 10\.'; then echo "VPN_ON"; echo "$on"; else echo "VPN_OFF"; fi
