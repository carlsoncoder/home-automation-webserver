#!/usr/bin/python
# Created by Justin Carlson - 2015-May-16

import os
import sys
import datetime
import time
import shutil

class MyFileInfo:
    def __init__(self, fullPath, relativePath, fileName, modifiedTime):
        self.fullPath = fullPath
        self.relativePath = relativePath
        self.fileName = fileName
        self.modifiedTime = modifiedTime

    def printObjectDetails(self):
        print self.fileName, '; ', self.relativePath, '; ', self.fullPath

    def buildKey(self):
        return self.relativePath + self.fileName


special_directories = ['/Users/carlson/Documents/_source/MEAN/carlsoncoder_meanwebsite/config', '/Users/carlson/Documents/_source/OpenShift/carlsoncoderwebsite/config']
ignored_directories = ['.git', '.idea', 'node_modules', 'uploads', '.openshift']
ignored_files = ['.DS_Store', 'copyToOpenShift.py', 'LICENSE', '.gitignore', '.jshintignore', 'gulpfile.js', 'deplist.txt']

def getFilesAndTimes(directoryToSearch, root, fileRecords):
    is_special_directory = False
    if directoryToSearch in special_directories:
        is_special_directory = True

    for dir in os.listdir(directoryToSearch):
        if os.path.isdir(os.path.join(directoryToSearch, dir)):
            if dir not in ignored_directories:
                getFilesAndTimes(directoryToSearch + '/' + dir, root, fileRecords)
        else:
            if dir not in ignored_files:
                if (is_special_directory and dir.find('config') == -1) or not is_special_directory:
                    fullFilePath = directoryToSearch + '/' + dir
                    modifiedTime = datetime.datetime.fromtimestamp(os.path.getmtime(fullFilePath))
                    relativePath = fullFilePath[len(root) + 1:]
                    relativePath = relativePath[0:relativePath.rfind('/') + 1]
                    evaluatedFile = MyFileInfo(fullFilePath, relativePath, dir, modifiedTime)
                    fileRecords[evaluatedFile.buildKey()] = evaluatedFile


def copyFilesToTarget(targetDirectory):
    currentDirectory = os.getcwd()

    sourceFileTimes = {}
    targetFileTimes = {}

    getFilesAndTimes(currentDirectory, currentDirectory, sourceFileTimes)
    getFilesAndTimes(targetDirectory, targetDirectory, targetFileTimes)

    for fileKey in sourceFileTimes:
        if fileKey in targetFileTimes:
            sourceFileInfo = sourceFileTimes[fileKey]
            targetFileInfo = targetFileTimes[fileKey]
            if sourceFileInfo.modifiedTime > targetFileInfo.modifiedTime:
                print 'Overwriting target file: [', targetFileInfo.fullPath, '] with updated file: [', sourceFileInfo.fullPath, ']'
                shutil.copy2(sourceFileInfo.fullPath, targetFileInfo.fullPath)
        else:
            print 'Source file: [', sourceFileTimes[fileKey].fullPath, '] does NOT exist in target - file will be copied'
            fullTargetFilePath = targetDirectory + '/' + sourceFileTimes[fileKey].relativePath + sourceFileTimes[fileKey].fileName
            if not os.path.exists(os.path.dirname(fullTargetFilePath)):
                os.makedirs(os.path.dirname(fullTargetFilePath))

            shutil.copy2(sourceFileTimes[fileKey].fullPath, fullTargetFilePath)

    for targetFileKey in targetFileTimes:
        if targetFileKey not in sourceFileTimes:
            print 'Deleting file: [', targetFileTimes[targetFileKey].fullPath, '] from target, as it no longer exists in source directory'
            os.remove(targetFileTimes[targetFileKey].fullPath)

try:
    openShiftDirectory = '/Users/carlson/Documents/_source/OpenShift/carlsoncoderwebsite'
    copyFilesToTarget(openShiftDirectory)
    print 'All files copied successfully - to deploy, you still need to do the following to actually deploy the changes to OpenShift:'
    print '     1)  cd into the target directory: cd', openShiftDirectory
    print '     2)  Run the \'git add .\' command'
    print '     2)  Run the \'git commit -a -m "Message For Commit"\' command'
    print '     2)  Run the \'git push\' command'

except BaseException as mainProgramException:
    print 'A BaseException has occurred: ', mainProgramException
except:
    print 'An unknown error has occurred!'