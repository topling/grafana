//go:build !windows && !nacl && !plan9
// +build !windows,!nacl,!plan9

package log

import (
	"errors"
	"log/syslog"
	"os"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
	"gopkg.in/ini.v1"
)

type SysLogHandler struct {
	syslog   *syslog.Writer
	Network  string
	Address  string
	Facility string
	Tag      string
	Format   Formatedlogger
}

func NewSyslog(sec *ini.Section, format Formatedlogger) *SysLogHandler {
	handler := &SysLogHandler{}

	handler.Format = format
	handler.Network = sec.Key("network").MustString("")
	handler.Address = sec.Key("address").MustString("")
	handler.Facility = sec.Key("facility").MustString("local7")
	handler.Tag = sec.Key("tag").MustString("")

	if err := handler.Init(); err != nil {
		level.Error(llog).Log("Failed to init syslog log handler", "error", err)
		os.Exit(1)
	}

	return handler
}

func (sw *SysLogHandler) Init() error {
	prio, err := parseFacility(sw.Facility)
	if err != nil {
		return err
	}

	w, err := syslog.Dial(sw.Network, sw.Address, prio, sw.Tag)
	if err != nil {
		return err
	}

	sw.syslog = w
	return nil
}

type levelOption func(logger log.Logger) log.Logger

func (sw *SysLogHandler) Log(keyvals ...interface{}) error {
	var err error
	for i := 0; i < len(keyvals)-1; i += 2 {
		if keyvals[i] != level.Key() {
			continue
		}
		switch keyvals[i+1] {
		case level.DebugValue():
			err = sw.syslog.Debug(keyvals)
		case level.InfoValue():
			err = sw.syslog.Info(keyvals)
		case level.WarnValue():
			err = sw.syslog.Warning(keyvals)
		case level.ErrorValue():
			err = sw.syslog.Err(keyvals)
		case "crit":
			err = sw.syslog.Crit(keyvals)
		default:
			err = errors.New("invalid syslog level")
		}
	}

	// syslogger := sw.Format(sw.syslog)
	// err = syslogger.Log(keyvals...)
	return err
}

func (sw *SysLogHandler) Close() error {
	return sw.syslog.Close()
}

var facilities = map[string]syslog.Priority{
	"user":   syslog.LOG_USER,
	"daemon": syslog.LOG_DAEMON,
	"local0": syslog.LOG_LOCAL0,
	"local1": syslog.LOG_LOCAL1,
	"local2": syslog.LOG_LOCAL2,
	"local3": syslog.LOG_LOCAL3,
	"local4": syslog.LOG_LOCAL4,
	"local5": syslog.LOG_LOCAL5,
	"local6": syslog.LOG_LOCAL6,
	"local7": syslog.LOG_LOCAL7,
}

func parseFacility(facility string) (syslog.Priority, error) {
	prio, ok := facilities[facility]
	if !ok {
		return syslog.LOG_LOCAL0, errors.New("invalid syslog facility")
	}

	return prio, nil
}
