#!/bin/sh
# ----------------------------------------------------------------------------
# Licensed to the Apache Software Foundation (ASF)
# Maven Wrapper script
# ----------------------------------------------------------------------------
MAVEN_CMD_LINE_ARGS="$MAVEN_CONFIG $@"
export MAVEN_CMD_LINE_ARGS

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WRAPPER_JAR="$SCRIPT_DIR/.mvn/wrapper/maven-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ]; then
  FALLBACK_MVN="$SCRIPT_DIR/../maven/apache-maven-3.9.6/bin/mvn"
  if [ -x "$FALLBACK_MVN" ]; then
    exec "$FALLBACK_MVN" "$@"
  fi

  if command -v mvn >/dev/null 2>&1; then
    exec mvn "$@"
  fi

  echo "ERROR: Maven wrapper JAR was not found at $WRAPPER_JAR." >&2
  echo "Add the wrapper JAR or install Maven to use this project." >&2
  exit 1
fi

exec "$SCRIPT_DIR/.mvn/wrapper/mvnw-exec.sh" "$@"
