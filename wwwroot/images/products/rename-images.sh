#!/usr/bin/env bash
shopt -s nullglob

# Loop over all files containing underscores in their name
for f in *.*; do
  # only rename if name actually contains an underscore
  if [[ "$f" == *"_"* ]]; then
    # construct new name by replacing all underscores with dashes
    new="${f//_/-}"
    # skip if target already exists
    if [[ -e "$new" ]]; then
      echo "Skipping '$f' → '$new' (target exists)"
    else
      echo "Renaming '$f' → '$new'"
      mv -- "$f" "$new"
    fi
  fi
done
