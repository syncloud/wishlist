import json
from subprocess import check_output

import pytest
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from syncloudlib.http import wait_for_rest
from syncloudlib.integration.hosts import add_host_alias
from syncloudlib.integration.installer import local_install

from settle import settle, assert_no_restarts

TMP_DIR = '/tmp/syncloud'
APP = 'wishlist'

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


@pytest.fixture(scope="session")
def module_setup(request, device, artifact_dir):
    def module_teardown():
        device.run_ssh('ls -la /var/snap/{0}/current > {1}/var.current.ls.log'.format(APP, TMP_DIR), throw=False)
        device.run_ssh('ls -la /var/snap/{0}/current/config > {1}/var.current.config.ls.log'.format(APP, TMP_DIR), throw=False)
        device.run_ssh('ls -la /var/snap/{0}/common > {1}/var.common.ls.log'.format(APP, TMP_DIR), throw=False)
        device.run_ssh('cp /var/snap/{0}/current/config/nginx.conf {1}/nginx.conf.log'.format(APP, TMP_DIR), throw=False)
        device.run_ssh('cat /var/snap/platform/current/config/authelia/config.yml > {0}/authelia.config.yml.log'.format(TMP_DIR), throw=False)
        device.run_ssh('top -bn 1 -w 500 -c > {0}/top.log'.format(TMP_DIR), throw=False)
        device.run_ssh('ps auxfw > {0}/ps.log'.format(TMP_DIR), throw=False)
        device.run_ssh('netstat -nlp > {0}/netstat.log'.format(TMP_DIR), throw=False)
        device.run_ssh('journalctl | tail -3000 > {0}/journalctl.log'.format(TMP_DIR), throw=False)
        device.scp_from_device('{0}/*'.format(TMP_DIR), artifact_dir)
        check_output('chmod -R a+r {0}'.format(artifact_dir), shell=True)

    request.addfinalizer(module_teardown)


def test_start(module_setup, device, device_host, app, domain):
    add_host_alias(app, device_host, domain)
    device.run_ssh('date', retries=100)
    device.run_ssh('mkdir -p {0}'.format(TMP_DIR))
    settle(device)


@pytest.mark.flaky(retries=50, delay=10)
def test_activate_device(device):
    device.run_ssh('rm -f /var/snap/platform/current/syncloud.crt', throw=False)
    response = device.activate_custom()
    assert response.status_code == 200, response.text


def test_install(app_archive_path, device_host, device_password, device):
    settle(device)
    local_install(device_host, device_password, app_archive_path)


def test_socket(device):
    device.run_ssh('test -S /var/snap/{0}/current/wishlist.sock'.format(APP), retries=100)


def test_services_started_cleanly(device):
    assert_no_restarts(device, APP)


def test_env_not_world_readable(device):
    mode = device.run_ssh('stat -c %a /var/snap/{0}/current/config/wishlist.env'.format(APP))
    assert mode.strip() == '600'


def test_index(app_domain):
    wait_for_rest(requests.session(), "https://{0}".format(app_domain), 200, 100)


def test_login_redirects_to_authelia(app_domain, domain):
    response = requests.get('https://{0}/login/oidc'.format(app_domain), verify=False, allow_redirects=False)
    assert response.status_code == 302, response.text
    assert response.headers['Location'].startswith('https://auth.{0}/'.format(domain))
    assert 'scope=openid+profile+email+groups' in response.headers['Location']


def test_password_login_disabled(app_domain):
    response = requests.get('https://{0}/setup-wizard'.format(app_domain), verify=False, allow_redirects=False)
    assert response.status_code == 302, response.text
    assert response.headers['Location'] == '/login'


def test_access_change(device):
    device.run_ssh('snap run {0}.access-change > {1}/access-change.log'.format(APP, TMP_DIR))


def test_index_after_access_change(app_domain):
    wait_for_rest(requests.session(), "https://{0}".format(app_domain), 200, 100)


def test_backup_restore(device, artifact_dir, app_domain):
    device.run_ssh('snap run platform.cli backup create {0}'.format(APP))
    response = device.run_ssh('snap run platform.cli backup list')
    open('{0}/cli.backup.list.json'.format(artifact_dir), 'w').write(response)
    backup = json.loads(response)[0]
    device.run_ssh('tar tf {0}/{1} | grep wishlist.db'.format(backup['path'], backup['file']))
    device.run_ssh('snap run platform.cli backup restore {0}'.format(backup['file']))
    wait_for_rest(requests.session(), "https://{0}".format(app_domain), 200, 100)


def test_remove(device, app):
    response = device.app_remove(app)
    assert response.status_code == 200, response.text


def test_reinstall(app_archive_path, device_host, device_password, app_domain):
    local_install(device_host, device_password, app_archive_path)
    wait_for_rest(requests.session(), "https://{0}".format(app_domain), 200, 100)


def test_services_started_cleanly_after_reinstall(device):
    device.run_ssh('test -S /var/snap/{0}/current/wishlist.sock'.format(APP), retries=100)
    assert_no_restarts(device, APP)
