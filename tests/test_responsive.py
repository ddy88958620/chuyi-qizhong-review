from pathlib import Path
root=Path(__file__).parents[1]
html=(root/'index.html').read_text()
css=(root/'assets/style.css').read_text()
assert 'name="viewport"' in html and 'width=device-width' in html
assert '.tabs' in css and 'overflow-x: auto' in css
assert 'scrollIntoView' in (root/'assets/app.js').read_text()
app=(root/'assets/app.js').read_text()
assert '可用于学习' in app
assert 'function learningPath(sub)' in app and 'path-tabs' in app and 'more-sections' in app and '全部原有板块' in app
assert '@media (max-width: 600px)' in css and '@media print' in css
assert 'min-height: 40px' in css
acceptance=(root/'docs/browser-acceptance-2026.md').read_text()
for route in ('#/zh/zh-outline','#/math/math-outline','#/eng/eng-outline','#/his/his-pep-core','#/geo/geo-pep-core','#/bio/bio-pep-core','#/df/df-pep-core','#/zh/zh-materials','#/math/math-materials','#/eng/eng-materials'):
    assert route in acceptance
print('responsive checks passed')
