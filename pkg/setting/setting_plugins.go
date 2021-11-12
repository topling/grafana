package setting

import (
	"strings"

	"gopkg.in/ini.v1"
)

// PluginSettings maps plugin id to map of key/value settings.
type PluginSettings map[string]map[string]string

type RemotePluginSettings map[string]RemotePluginOpts

type RemotePluginOpts struct {
	ServerAddr            string
	TLSEnabled            bool
	TLSCAFile             string
	TLSCertFile           string
	TLSKeyFile            string
	TLSInsecureSkipVerify bool
	TLSServerName         string
}

func extractPluginSettings(sections []*ini.Section) PluginSettings {
	psMap := PluginSettings{}
	for _, section := range sections {
		sectionName := section.Name()
		if !strings.HasPrefix(sectionName, "plugin.") {
			continue
		}

		pluginID := strings.Replace(sectionName, "plugin.", "", 1)
		psMap[pluginID] = section.KeysHash()
	}

	return psMap
}

func extractRemotePluginSettings(sections []*ini.Section) RemotePluginSettings {
	rpsMap := RemotePluginSettings{}
	for _, section := range sections {
		sectionName := section.Name()
		if !strings.HasPrefix(sectionName, "plugin.") {
			continue
		}

		pluginID := strings.Replace(sectionName, "plugin.", "", 1)

		remoteAddr := section.Key("remote_server_addr").MustString("")
		if len(remoteAddr) == 0 {
			continue
		}

		rpsMap[pluginID] = RemotePluginOpts{
			ServerAddr:            remoteAddr,
			TLSEnabled:            section.Key("remote_server_tls_enabled").MustBool(false),
			TLSServerName:         section.Key("remote_server_tls_server_name").MustString(""),
			TLSCAFile:             section.Key("remote_server_tls_ca_file").MustString(""),
			TLSCertFile:           section.Key("remote_server_tls_cert_file").MustString(""),
			TLSKeyFile:            section.Key("remote_server_tls_key_file").MustString(""),
			TLSInsecureSkipVerify: section.Key("remote_server_tls_insecure_skip_verify").MustBool(false),
		}
	}

	return rpsMap
}
