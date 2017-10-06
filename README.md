# posthtml-minify-inline-css

Finds redundant inline CSS styles in HTML and removes them. This is
very useful for emails, where styles need to be inline for client
support.

For example, if you have a node like:

   \<td style="color: red;width: 100px;"\>\</td\>

Then the "width" attribute may be meaningful for layout, but the
"color" attribute cannot affect anything and will be removed by this
package.

# License

MIT
