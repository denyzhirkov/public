# File manager

This document focuses on the Datagrok file manager features for working with
files. This document doesn't describe working with databases and open API web
services.

## File manager overview

Datagrok file manager is a science-aware environment that provides the standard
file management features and data science capabilities:

* File manager is associated with a workspace that provides interactive data
  processing dashboards.
* Applications can run from the file manager, for example, [ClinicalCase
  pakage](https://github.com/datagrok-ai/public/tree/master/packages/ClinicalCase#readme)
  automatically detects clinical data files in the folder.
* [Scripts](https://datagrok.ai/help/compute/scripting) can preprocess data.

Learn how to:

* [Load a file from:](#load-overview)
  * [Local host](#from-local-host)
  * [Remote file storage:](#from-remote-file-storage)
  * [**Home** folder or other accessible folder in Datagrok](#from-home-folder)
* [Keep data up to date](#refresh-a-file)
* [Share a file as:](#share)
  * [Data table](#sharing-a-data-table)
  * [File](#sharing-a-file)
* [Upload processed data](#upload)

<!--See useful features:

* [Dashboard](#dashboard)
* [Clinical case](#clinical-data)
* [Scripts](#scripts)-->

## Load a file

Datagrok supports most file formats, including [tabular and molecular
structure](https://datagrok.ai/help/access/file) ones.

Learn the steps to load a file from different types of storage.

### From local host

To load a local file, drag and drop it into the Datagrok workspace. The platform
highlights the area where to place it.

### From remote file storage

To load a file, you need to connect the file storage. Datagrok supports
connection with most common data storages:

* Dropbox
* Files
* Git
* GitHub
* Google Cloud
* S3

To access the required file storage create a new file share:

* _Step 1._ In the left side panel, select  icon >**Files** > **Actions** >
  **New File Share**.

![New File Share](Files-uploading-new-file-share.png)

* _Step 2._ In the new dialog, select **Data Source** from the dropdown list and
fill in the required fields. To load the file, doubleclick it.

### From **Home** folder

Every user in Datagrok has a **Home** folder. It is the user's personal file
storage.

To access the **Home** folder in the left side panel, select  icon > **Files**.
The Home folder is the first in the middle panel.

![Home folder](Files-uploading-Home-folder.png)

To load from the **Home** folder, doubleclick the required file.

**NOTE:** Datagrok operates the Home folder as a regular connection.

### Refresh a file

Datagrok remembers all the file connections while loading files and can
reproduce any of them. So to get a current file copy, refresh the file; no
additional connection is needed. The local host loading is the only exception
because, in this case, Datagrok doesn't create an actual connection.

To refresh the file in the left side panel, select icon >**File** > **REFRESH**.

![Refresh](Files-uploading-refresh.png)

<!--## Working with data features

### Clinical data

### Scripts

### Dashboard

Once you upload the file, the platform recognizes the data and offers tools for data processing-->

## Share

In Datagrok, you can share all the opened files or choose the files you want to
share from the ones accessible to you. Also, you can assign [privileges and
access rights](https://datagrok.ai/help/govern/security) to each user or
[groups](https://datagrok.ai/help/govern/group) you share with.

To support the differentiation of user access rights of other organizations,
Datagrok supports their credentials. So a single organization's file connection
may support multiple users’ credentials. In this case, when creating a new file
share, the user must use the given login and password as access and secret keys.

### Share a data table

To share the opened file as a data table in the left side panel, select  icon >
**File** >  icon.

**NOTE:** Datagrok shares all the files opened in the project while choosing the
data table form to share.

![Sharing a file as a data table](Files-uploading-share-the-table.png)

When turning on **Data sync**, data reloads when a user opens the project.

![Data sync](Files-uploading-share-the-table-sync-data.png)

### Share a file

Datagrok doesn’t share files directly. To share a file:

* _Step 1._ Open connection to the file directory:

1. In the left side panel, select  icon > **Files**.
2. Right-click the file.
3. Select **Share**.

![Connection to the file directory](Files-uploading-share-the-file.png)

In the opened dialog you can choose to share the **Home** folder or to create a
new connection to the file directory itself.

**NOTE:** We don’t recommend sharing the Home folder.

![Share the file](Files-uploading-share-the-file-directory.png)

* _Step 2._ Copy the link to the file and send it to the user or the group you
want to share with. To copy the link in the opened dialog, select icon.

![Copy the link](Files-uploading-copy-the-link.png)

**NOTE:** you can also copy the file URL from the address bar, when the file is
opened:

1. In the left side panel, select  icon.
2. Choose the file.
3. Copy its URL from the address bar.

![Copy the link](Files-uploading-copy-the-link-2.png)

## Upload a project

After processing the data, file manager allows to upload current project to the
server.

To upload the project in the left side pannel, select **Projects** icon >
**UPLOAD**.

When turning on **Data sync**, data reloads when a user opens the project.

After saving the project, you can set user previleges to the project.
<!--
![Upload the project](./File-manager- upload-the-project.gif "Upload the project")-->
