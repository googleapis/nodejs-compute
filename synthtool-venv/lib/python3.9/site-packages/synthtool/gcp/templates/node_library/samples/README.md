[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."
<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

{% if 'partials' in metadata and metadata['partials']['title'] -%}
{{ metadata['partials']['title'] }} Samples
{% else -%}
# [{{ metadata['repo']['name_pretty'] }}: {{ metadata['repo']['language']|language_pretty }} Samples](https://github.com/{{ metadata['repo']['repo'] }})
{%- endif %}

[![Open in Cloud Shell][shell_img]][shell_link]

{% if metadata['partials'] and metadata['partials']['introduction'] %}{{ metadata['partials']['introduction'] }}{% endif %}

## Table of Contents

* [Before you begin](#before-you-begin)
* [Samples](#samples){% if metadata['samples']|length %}{% for sample in metadata['samples'] %}
  * [{{ sample.title }}](#{{ sample.title|slugify }}){% endfor %}{% endif %}

## Before you begin

Before running the samples, make sure you've followed the steps outlined in
[Using the client library](https://github.com/{{ metadata['repo']['repo']  }}#using-the-client-library).

{% if 'partials' in metadata and metadata['partials']['samples_body'] %}{{ metadata['partials']['samples_body'] }}

{% endif -%}

`cd samples`

`npm install`

`cd ..`

## Samples
{% if metadata['samples']|length %}
{% for sample in metadata['samples'] %}

### {{sample.title}}

{%- if 'description' in sample %}

{{ sample.description }}

{%- endif %}

View the [source code](https://github.com/{{ metadata['repo']['repo']  }}/blob/{{ metadata['repo']['default_branch'] }}/{{ sample.file }}).

[![Open in Cloud Shell][shell_img]](https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/{{ metadata['repo']['repo']  }}&page=editor&open_in_editor={{ sample.file }},samples/README.md)

__Usage:__


{% if 'usage' in sample %}`{{ sample.usage }}`{% else %}`node {{ sample.file }}`{% endif %}

{% if not loop.last %}
-----
{% endif %}

{% endfor %}
{% endif %}

[shell_img]: https://gstatic.com/cloudssh/images/open-btn.png
[shell_link]: https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/{{ metadata['repo']['repo']  }}&page=editor&open_in_editor=samples/README.md
[product-docs]: {{ metadata['repo']['product_documentation'] }}
