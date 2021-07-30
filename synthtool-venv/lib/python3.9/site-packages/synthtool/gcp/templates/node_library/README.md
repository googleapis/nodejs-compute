[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

{% if 'partials' in metadata and metadata['partials']['title'] -%}
{{ metadata['partials']['title'] }}
{% else -%}
# [{{ metadata['repo']['name_pretty'] }}: {{ metadata['repo']['language']|language_pretty }} Client](https://github.com/{{ metadata['repo']['repo'] }})
{%- endif %}

{{ metadata['repo']['release_level']|release_quality_badge }}
[![npm version](https://img.shields.io/npm/v/{{ metadata['name'] }}.svg)](https://www.npmjs.org/package/{{ metadata['name'] }})
[![codecov](https://img.shields.io/codecov/c/github/{{ metadata['repo']['repo'] }}/master.svg?style=flat)](https://codecov.io/gh/{{ metadata['repo']['repo'] }})

{% if metadata['deprecated'] %}
| :warning: Deprecated Module |
| --- |
| This library is **deprecated**. {{ metadata['deprecated'] }} |
{% endif %}

{% if 'partials' in metadata and metadata['partials']['introduction'] %}
{{ metadata['partials']['introduction'] }}
{% else %}
{{ metadata['description'] }}
{% endif %}

A comprehensive list of changes in each version may be found in
[the CHANGELOG](https://github.com/{{ metadata['repo']['repo'] }}/blob/{{metadata['repo']['default_branch']}}/CHANGELOG.md).

{% if metadata['repo']['client_documentation'] %}* [{{ metadata['repo']['name_pretty'] }} {{ metadata['repo']['language']|language_pretty }} Client API Reference][client-docs]{% endif %}
{% if metadata['repo']['product_documentation'] %}* [{{ metadata['repo']['name_pretty'] }} Documentation][product-docs]{% endif %}
* [github.com/{{ metadata['repo']['repo'] }}](https://github.com/{{ metadata['repo']['repo'] }})

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**


* [Quickstart](#quickstart)
{% if metadata['repo']['api_id'] %}  * [Before you begin](#before-you-begin){% endif %}
  * [Installing the client library](#installing-the-client-library)
{% if metadata['quickstart'] %}  * [Using the client library](#using-the-client-library){% endif %}
{% if metadata['samples']|length %}* [Samples](#samples){% endif %}
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Quickstart
{% if metadata['repo']['api_id'] %}
### Before you begin

1.  [Select or create a Cloud Platform project][projects].{% if metadata['repo']['requires_billing'] %}
1.  [Enable billing for your project][billing].{% endif %}
1.  [Enable the {{ metadata['repo']['name_pretty'] }} API][enable_api].
1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.
{% endif %}
### Installing the client library

```bash
{{ metadata['lib_install_cmd'] }}
```

{% if  metadata['quickstart'] %}
### Using the client library

```{{ metadata['repo']['language']|syntax_highlighter }}
{{ metadata['quickstart'] }}
```
{% endif %}{% if 'partials' in metadata and metadata['partials']['body'] %}{{ metadata['partials']['body'] }}{% endif %}

{% if metadata['samples']|length %}
## Samples

Samples are in the [`samples/`](https://github.com/{{  metadata['repo']['repo'] }}/tree/{{ metadata['repo']['default_branch'] }}/samples) directory. Each sample's `README.md` has instructions for running its sample.

| Sample                      | Source Code                       | Try it |
| --------------------------- | --------------------------------- | ------ |
{% for sample in metadata['samples'] %}| {{ sample.title }} | [source code](https://github.com/{{ metadata['repo']['repo']  }}/blob/{{ metadata['repo']['default_branch'] }}/{{ sample.file }}) | [![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/{{ metadata['repo']['repo'] }}&page=editor&open_in_editor={{ sample.file }},samples/README.md) |
{% endfor %}
{% endif %}
{% if metadata['repo']['client_documentation'] %}
The [{{ metadata['repo']['name_pretty'] }} {{ metadata['repo']['language']|language_pretty }} Client API Reference][client-docs] documentation
also contains samples.
{% endif %}
## Supported Node.js Versions

Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/).
Libraries are compatible with all current _active_ and _maintenance_ versions of
Node.js.

Client libraries targeting some end-of-life versions of Node.js are available, and
can be installed via npm [dist-tags](https://docs.npmjs.com/cli/dist-tag).
The dist-tags follow the naming convention `legacy-(version)`.

_Legacy Node.js versions are supported as a best effort:_

* Legacy versions will not be tested in continuous integration.
* Some security patches may not be able to be backported.
* Dependencies will not be kept up-to-date, and features will not be backported.

#### Legacy tags available

* `legacy-8`: install client libraries from this dist-tag for versions
  compatible with Node.js 8.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

{% if metadata['repo']['release_level'] == 'ga' %}
This library is considered to be **General Availability (GA)**. This means it
is stable; the code surface will not change in backwards-incompatible ways
unless absolutely necessary (e.g. because of critical security issues) or with
an extensive deprecation period. Issues and requests against **GA** libraries
are addressed with the highest priority.
{% endif %}
{% if metadata['repo']['release_level'] == 'beta' %}
This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.
{% endif %}
{% if metadata['repo']['release_level'] == 'alpha' %}
This library is considered to be in **alpha**. This means it is still a
work-in-progress and under active development. Any release is subject to
backwards-incompatible changes at any time.
{% endif %}
{% if metadata['release_level'] == 'deprecated' %}
This library is **deprecated**. This means that it is no longer being
actively maintained and the only updates the library will receive will
be for critical security issues. {% if metadata['deprecated'] %}{{ metadata['deprecated'] }}{% endif %}
{% endif %}

More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/{{ metadata['repo']['repo'] }}/blob/{{ metadata['repo']['default_branch'] }}/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## License

Apache Version 2.0

See [LICENSE](https://github.com/{{ metadata['repo']['repo'] }}/blob/{{ metadata['repo']['default_branch'] }}/LICENSE)

{% if metadata['repo']['client_documentation'] %}[client-docs]: {{ metadata['repo']['client_documentation'] }}{% endif %}
{% if metadata['repo']['product_documentation'] %}[product-docs]: {{ metadata['repo']['product_documentation'] }}{% endif %}
[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
{% if metadata['repo']['api_id'] %}[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid={{ metadata['repo']['api_id'] }}{% endif %}
[auth]: https://cloud.google.com/docs/authentication/getting-started
