[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."

## Python Samples for {{ metadata['repo']['name_pretty'] }}

This directory contains samples for {{ metadata['repo']['name_pretty'] }}, which may be used as a refererence for how to use this product. {% if metadata['repo']['custom_content'] is defined %}
{{ metadata['repo']['custom_content']}}{% endif %}{% if metadata['repo']['samples']|length %}
Samples, quickstarts, and other documentation are available at <a href="{{ metadata['repo']['product_documentation'] }}">cloud.google.com</a>.
{% for sample in range(metadata['repo']['samples']|length) %}

### {{ metadata['repo']['samples'][sample]['name']}}

{{ metadata['repo']['samples'][sample]['description']}}
{% if metadata['repo']['samples'][sample]['runnable'] %}

<a href="https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/{{ metadata['repo']['repo'] }}&page=editor&open_in_editor={{ metadata['repo']['samples'][sample]['file'] }}"><img alt="Open in Cloud Shell" src="http://gstatic.com/cloudssh/images/open-btn.png"> 
</a>

To run this sample:

1. If this is your first time working with GCP products, you will need to set up [the Cloud SDK][cloud_sdk] or utilize [Google Cloud Shell][gcloud_shell]. This sample may [require authetication][authentication]{% if metadata['repo']['requires_billing'] %} and you will need to [enable billing][enable_billing]{% endif %}.

1. Make a fork of this repo and clone the branch locally, then navigate to the sample directory you want to use.

1. Install the dependencies needed to run the samples.

        pip install -r requirements.txt

1. Run the sample using

        python {{ metadata['repo']['samples'][sample]['file']}}

{% endif %}
{% if 'show_help' in metadata['repo']['samples'][sample] and metadata['repo']['samples'][sample]['show_help'] and 'abs_path' in metadata['repo']['samples'][sample] %}{{get_help(metadata['repo']['samples'][sample]['abs_path'])|indent}}{% endif %}
{% if metadata['repo']['samples'][sample]['custom_content'] is defined %}{{ metadata['repo']['samples'][sample]['custom_content'] }}{% endif %}{% endfor %}{% endif %}

## Additional Information
{% if metadata['repo']|length %}{% if metadata['repo']['client_library'] %}
These samples use the [Google Cloud Client Library for Python][client_library_python].{% endif %}
You can read the documentation for more details on API usage and use GitHub
to <a href="https://github.com/{{ metadata['repo']['repo'] }}">browse the source</a> and [report issues][issues].{% endif %}

### Contributing
View the [contributing guidelines][contrib_guide], the [Python style guide][py_style] for more information.

[authentication]: https://cloud.google.com/docs/authentication/getting-started
[enable_billing]:https://cloud.google.com/apis/docs/getting-started#enabling_billing
[client_library_python]: https://googlecloudplatform.github.io/google-cloud-python/
[issues]: https://github.com/GoogleCloudPlatform/google-cloud-python/issues
[contrib_guide]: https://github.com/googleapis/google-cloud-python/blob/master/CONTRIBUTING.rst
[py_style]: http://google.github.io/styleguide/pyguide.html
[cloud_sdk]: https://cloud.google.com/sdk/docs
[gcloud_shell]: https://cloud.google.com/shell/docs
[gcloud_shell]: https://cloud.google.com/shell/docs
