import os, io, json, tarfile, time, shutil
APP='app'; info=json.load(open(f'{APP}/appinfo.json'))
aid, ver = info['id'], info['version']
now=int(time.time())
def tgz(files):  # files: list of (arcname, bytes or None for dir)
    b=io.BytesIO()
    with tarfile.open(fileobj=b,mode='w:gz',format=tarfile.GNU_FORMAT) as t:
        for name,data in files:
            ti=tarfile.TarInfo(name); ti.mtime=now; ti.uid=ti.gid=0; ti.uname=ti.gname='root'
            if data is None: ti.type=tarfile.DIRTYPE; ti.mode=0o755; t.addfile(ti)
            else: ti.size=len(data); ti.mode=0o644; t.addfile(ti,io.BytesIO(data))
    return b.getvalue()
data=[]; size=0
for d in ['./','./usr/','./usr/palm/','./usr/palm/applications/',f'./usr/palm/applications/{aid}/','./usr/palm/packages/',f'./usr/palm/packages/{aid}/']:
    data.append((d,None))
for f in sorted(os.listdir(APP)):
    b=open(f'{APP}/{f}','rb').read(); size+=len(b)
    data.append((f'./usr/palm/applications/{aid}/{f}',b))
pk=json.dumps({"app":aid,"id":aid,"loc_name":info['title'],"package_format_version":2,"vendor":info['vendor'],"version":ver},ensure_ascii=False,indent=4).encode()
size+=len(pk); data.append((f'./usr/palm/packages/{aid}/packageinfo.json',pk))
control=f"""Package: {aid}
Version: {ver}
Section: misc
Priority: optional
Architecture: all
Installed-Size: {size}
Maintainer: N/A <nobody@example.com>
Description: {info['title']}
webOS-Package-Format-Version: 2
webOS-Packager-Version: 1.0.0
""".encode()
members=[('debian-binary',b'2.0\n'),('control.tar.gz',tgz([('./',None),('./control',control)])),('data.tar.gz',tgz(data))]
out=f'{aid}_{ver}_all.ipk'
with open(out,'wb') as o:
    o.write(b'!<arch>\n')
    for n,b in members:
        h=f'{n:<16}{now:<12}{0:<6}{0:<6}{"100644":<8}{len(b):<10}`\n'.encode()
        assert len(h)==60; o.write(h); o.write(b)
        if len(b)%2: o.write(b'\n')
print(out)
