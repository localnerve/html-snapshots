/*
 * cload.js
 *
 * Conditionally load a module
 * Usage:
 *   cload!condition?module
 * If condition is true, then the module loads
 */
(function () {
    // Helper function to parse the 'N?value'
    // format used in the resource name.
    function parse(name) {
        var parts = name.split('?'),
            value = parts[0],
            module = parts[1],
            condition = false;

        value = value.replace(/^\s+|\s+$/g, "").toLowerCase();
        condition = (value === "true");

        return {
            condition: condition,
            module: module
        };
    }

    // Main module definition.
    define({
        normalize: function (name, normalize) {
            var parsed = parse(name),
                module = parsed.module;

            // Normalize the module
            module = normalize(module);

            return parsed.condition + "?" + module;
        },

        load: function (name, req, onload, config) {
            var parsed = parse(name);
            if (parsed.condition) {
                req([parsed.module], function (value) {
                    onload(value);
                });
            } else { onload(); }
        }
    });

}());