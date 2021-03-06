---
title: "Mocker patch at rescue."
layout: post
date: 2020-09-10 22:52
image: /assets/images/markdown.jpg
headerImage: false
projects: true
hidden: false # don't count this post in blog pagination
tag:
- pytest
- mock
- python
- unittests
category: blog
author: priyankajayaswal
description: Mocker patch for mocking in python
---

This mini blog would talk about using mocker patch from pytest to mock variables in object creation flow . This patching can be applied to a variable which is used somewhere deep in the codebase with no direct access for mock using conventional techniques. (Conventional techniques meant directly passing an altered/mocked variable).

A scenario:

For creation of app object we use config. This config object is created  in the codeflow somewhere inaccessible for direct mocking eg.

- ServiceApp inherits BaseApp
- BaseApp uses Config class to populate self.config variable which is immediately consumed in self.consume_config function in init flow of app.
- Since config sits deep, it's difficult to inject the mocked value directly at time of app object initialization.

Here comes, mocker.patch to rescue:

1. Create a patch object
   - `config_mock = mocker.patch("<complete_path_to_Config_class>")`

2. Fetch the method you selectively want to patch
   - `get_config_path = config_mock.return_value.get_config`

3. Override the return type for this object 
   - `get_config_path.return_type = <patched_mocked_config_value>`

4. Now initialise your app object
   - `app = ServiceApp()`

The mocked config values would be used instead.

\cheers
