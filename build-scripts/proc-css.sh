#!/bin/sh

# Author: AkimotoAkari (AkirisWu) 2017
# Arguments: $1: input file, $2: output file path (abs. path)
cleancss -o ${2} ${1}
exit $?