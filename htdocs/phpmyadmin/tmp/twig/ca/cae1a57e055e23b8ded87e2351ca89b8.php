<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\CoreExtension;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* server/privileges/subnav.twig */
class __TwigTemplate_9e0aa04e46989b29d3d3901b39e39985 extends Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 1
        yield "<div class=\"row\">
  <ul class=\"nav nav-pills m-2\">
    <li class=\"nav-item\">
      <a class=\"nav-link";
        // line 4
        yield (((($context["active"] ?? null) == "privileges")) ? (" active") : (""));
        yield " disableAjax\" href=\"";
        yield PhpMyAdmin\Url::getFromRoute("/server/privileges", ["viewing_mode" => "server"]);
        yield "\">
        ";
yield _gettext("User accounts overview");
        // line 6
        yield "      </a>
    </li>
    ";
        // line 8
        if (($context["is_super_user"] ?? null)) {
            // line 9
            yield "      <li class=\"nav-item\">
        <a class=\"nav-link";
            // line 10
            yield (((($context["active"] ?? null) == "user-groups")) ? (" active") : (""));
            yield " disableAjax\" href=\"";
            yield PhpMyAdmin\Url::getFromRoute("/server/user-groups");
            yield "\">
          ";
yield _gettext("User groups");
            // line 12
            yield "        </a>
      </li>
    ";
        }
        // line 15
        yield "  </ul>
</div>
";
        return; yield '';
    }

    /**
     * @codeCoverageIgnore
     */
    public function getTemplateName()
    {
        return "server/privileges/subnav.twig";
    }

    /**
     * @codeCoverageIgnore
     */
    public function isTraitable()
    {
        return false;
    }

    /**
     * @codeCoverageIgnore
     */
    public function getDebugInfo()
    {
        return array (  71 => 15,  66 => 12,  59 => 10,  56 => 9,  54 => 8,  50 => 6,  43 => 4,  38 => 1,);
    }

    public function getSourceContext()
    {
        return new Source("", "server/privileges/subnav.twig", "I:\\MYXAMPP\\MyServer\\htdocs\\phpmyadmin\\templates\\server\\privileges\\subnav.twig");
    }
}
