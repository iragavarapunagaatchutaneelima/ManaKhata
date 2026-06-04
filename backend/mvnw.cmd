@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.

@REM Apache Maven Wrapper
@REM A batch script which takes the Maven project, downloads the wrapper jar
@REM and executes it with the given arguments.

@echo off

setlocal

set ERROR_CODE=0

@REM To isolate internal variables from possible polluting the user local environment,
@REM we use setlocal/endlocal when user samples the `env` var in Windows' cmd into this script.
setlocal enableextensions enabledelayedexpansion

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@REM This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@REM Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

set WRAPPER_JAR=%APP_HOME%\.mvn\wrapper\maven-wrapper.jar
if not exist "%WRAPPER_JAR%" (
    for %%i in ("%APP_HOME%\..\maven\apache-maven-3.9.6\bin\mvn.cmd") do set FALLBACK_MVN=%%~fi
    if exist "!FALLBACK_MVN!" (
        call "!FALLBACK_MVN!" %*
        exit /b %ERRORLEVEL%
    )

    where mvn.cmd >NUL 2>&1
    if !ERRORLEVEL! equ 0 (
        call mvn.cmd %*
        exit /b %ERRORLEVEL%
    )

    echo.
    echo ERROR: Maven wrapper JAR was not found at "%WRAPPER_JAR%".
    echo Add the wrapper JAR or install Maven to use this project.
    echo.
    exit /b 1
)

@REM Add default JVM options here. You can also use JAVA_OPTS and MAVEN_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE="%JAVA_HOME%\bin\java.exe"

if exist %JAVA_EXE% goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:execute
@REM Detect the bit version of the JAVA_EXE and set the appropriate JVM arguments
for /f "usebackq tokens=*" %%z in (`"%JAVA_EXE%" -XX:+PrintFlagsFinal -version 2^>^&1 ^| find /i "os.arch"`) do (
    set JVM_ARCH_DETECT=%%z
)

@REM Check if this is a 64-bit JVM
if "%JVM_ARCH_DETECT%"=="" (
    set JAVA_ARCH=x86
) else (
    for /f tokens^=3 %%i in ("%JVM_ARCH_DETECT%") do set JAVA_ARCH=%%i
)

@REM Initializing the argument line
set CLASSPATH="%WRAPPER_JAR%"
set MAVEN_PROJECTBASEDIR=%APP_HOME%

@REM Find the project base dir, i.e. the directory that contains the folder ".mvn".
if "%MAVEN_PROJECTBASEDIR%"=="" goto error_no_maven_home

@REM Determine the Java command to use to start the JVM.
if not "%JAVA_HOME%" == "" goto MavenCmdLine

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 (
    goto MavenCmdLine
) else (
    goto error_no_java_exe
)

:MavenCmdLine
@REM Reaching here means variables are defined and arguments have been captured
:init

@REM Setup the command line
set CLASSWORLDS_LAUNCHER=org.codehaus.plexus.classworlds.launcher.Launcher

@REM Maven's `run.bat` has removed `-Dclassworlds.conf` because of troublesome escaping.
set MAVEN_CMD_LINE_ARGS=%*

%JAVA_EXE% %DEFAULT_JVM_OPTIONS% %JAVA_OPTS% %MAVEN_OPTS% -classpath %CLASSPATH% %CLASSWORLDS_LAUNCHER% %MAVEN_CMD_LINE_ARGS%

endlocal & exit /b %ERRORLEVEL%
if %ERRORLEVEL% neq 0 goto error_exit

:error_exit
set ERROR_CODE=%ERRORLEVEL%

:error_no_java_exe
echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.

goto fail

:error_no_maven_home
echo.
echo ERROR: the classpath may be invalid.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
echo.

goto fail

:fail
if "%OS%"=="Windows_NT" ^
    endlocal & exit /b %ERROR_CODE%
exit /b %ERROR_CODE%

:end_of_script
endlocal & goto :EOF
