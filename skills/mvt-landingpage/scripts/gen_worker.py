"""
Generate Cloudflare Worker JS from index.html.
Usage: python gen_worker.py <input_html> <output_js>
"""
import re, os, sys

def generate_worker(input_html='index.html', output_js='worker.js'):
    with open(input_html, 'r', encoding='utf-8') as f:
        html = f.read()

    # Escape for JS template literal
    escaped = html.replace('\\', '\\\\')
    escaped = escaped.replace('`', '\\`')
    escaped = re.sub(r'\$\{', '\\${', escaped)

    worker_js = 'const HTML_CONTENT = `' + escaped + '`;\n\n'
    worker_js += '''export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    return new Response(HTML_CONTENT, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
'''

    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(worker_js)

    size = os.path.getsize(output_js)
    print(f'worker.js created: {size:,} bytes ({size/1024:.1f} KB)')
    return output_js

if __name__ == '__main__':
    input_html = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
    output_js = sys.argv[2] if len(sys.argv) > 2 else 'worker.js'
    generate_worker(input_html, output_js)
