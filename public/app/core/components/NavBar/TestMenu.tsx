import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { useMenuTriggerState, useTreeState } from 'react-stately';
import {
  DismissButton,
  FocusScope,
  mergeProps,
  useButton,
  useFocus,
  useFocusWithin,
  useMenu,
  useMenuItem,
  useMenuTrigger,
  useOverlay,
} from 'react-aria';
import { Icon, IconName, Link, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

console.log('test');

export function MenuButton(props: any) {
  const theme = useTheme2();

  const { link, isActive, ...rest } = props;
  const styles = getStyles(theme, isActive);

  // Create state based on the incoming props
  const state = useMenuTriggerState({
    ...rest,
    onOpenChange: (isOpen) => {
      console.log({ isOpen });
    },
  });

  // Get props for the menu trigger and menu elements
  const ref = React.useRef(null);
  const { menuTriggerProps, menuProps } = useMenuTrigger({}, state, ref);
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: (isFocused) => {
      if (isFocused) {
        state.open();
      }
      // if (!isFocused) {
      //   state.close();
      // }
    },
  });

  const [enableAllItems, setEnableAllItems] = useState(false);

  // Get props for the button based on the trigger props from useMenuTrigger
  const { buttonProps } = useButton(
    {
      ...menuTriggerProps,
      onKeyDown: (e) => {
        switch (e.key) {
          case 'Enter':
          case ' ':
            e.continuePropagation();
            link.onClick();
            break;
          case 'ArrowRight':
            e.continuePropagation();
            setEnableAllItems(true);
            break;
          case 'ArrowLeft':
            e.continuePropagation();
            setEnableAllItems(false);
            break;
          default:
            break;
        }
      },
    },
    ref
  );

  let element = (
    <button {...buttonProps} ref={ref} onClick={link.onClick} aria-label={link.label}>
      <span>
        {link.icon && <Icon name={link.icon as IconName} size="xl" />}
        {link.img && <img src={link.img} alt={`${link.text} logo`} />}
      </span>
    </button>
  );

  if (link.url) {
    element =
      !link.target && link.url.startsWith('/') ? (
        <Link {...buttonProps} ref={ref} href={link.url} target={link.target} onClick={link.onClick}>
          <span>
            {link.icon && <Icon name={link.icon as IconName} size="xl" />}
            {link.img && <img src={link.img} alt={`${link.text} logo`} />}
          </span>
        </Link>
      ) : (
        <a href={link.url} target={link.target} onClick={link.onClick} {...buttonProps} ref={ref}>
          <span>
            {link.icon && <Icon name={link.icon as IconName} size="xl" />}
            {link.img && <img src={link.img} alt={`${link.text} logo`} style={{ width: '100%' }} />}
          </span>
        </a>
      );
  }

  return (
    <li className={cx(styles.container, 'dropdown')} {...focusWithinProps}>
      {element}
      {/*state.isOpen && (*/}
      {state.isOpen && (
        <MenuPopup
          {...rest}
          enableAllItems={enableAllItems}
          domProps={menuProps}
          autoFocus={state.focusStrategy}
          onClose={() => state.close()}
        />
      )}
    </li>
  );
}

function MenuPopup(props: any) {
  const { enableAllItems, ...rest } = props;
  const disabledKeys = enableAllItems ? [] : [];
  // Create menu state based on the incoming props
  const state = useTreeState({ ...rest, disabledKeys: [], selectionMode: 'none' });

  // Get props for the menu element
  const ref = React.useRef(null);
  const { menuProps } = useMenu(rest, state, ref);

  // Handle events that should cause the menu to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  const overlayRef = React.useRef(null);
  const { overlayProps } = useOverlay(
    {
      onClose: props.onClose,
      shouldCloseOnBlur: true,
      isOpen: true,
      isDismissable: true,
    },
    overlayRef
  );

  const theme = useTheme2();
  // Wrap in <FocusScope> so that focus is restored back to the
  // trigger when the menu is closed. In addition, add hidden
  // <DismissButton> components at the start and end of the list
  // to allow screen reader users to dismiss the popup easily.
  return (
    <FocusScope restoreFocus>
      <div {...overlayProps} ref={overlayRef} tabIndex={-1}>
        <DismissButton onDismiss={props.onClose} />
        <ul
          {...mergeProps(menuProps, props.domProps)}
          ref={ref}
          style={{
            backgroundColor: `${theme.colors.action.hover}`,
            color: `${theme.colors.text.primary}`,
            position: 'absolute',
            margin: '4px 0 0 0',
            padding: 0,
            listStyle: 'none',
            background: 'lightgray',
            left: `${theme.components.sidemenu.width - 1}px`,
          }}
          tabIndex={-1}
        >
          {[...state.collection].map((item) => (
            <MenuItem
              key={item.key}
              item={item}
              state={state}
              onAction={props.onAction}
              onClose={props.onClose}
              enabled={enableAllItems}
            />
          ))}
        </ul>
        <DismissButton onDismiss={props.onClose} />
      </div>
    </FocusScope>
  );
}

function MenuItem({ item, state, onAction, onClose, enabled }: any) {
  // Get props for the menu item element
  const ref = React.useRef(null);
  if (!enabled) {
    state.disabledKeys.add(item.key);
  } else {
    state.disabledKeys.delete(item.key);
  }
  console.log({ enabled });
  console.log({ keys: state.disabledKeys });

  const { menuItemProps } = useMenuItem(
    {
      key: item.key,
      onAction,
      onClose,
    },
    state,
    ref
  );

  console.log({ tabIndex: menuItemProps.tabIndex, ariaDisabled: menuItemProps['aria-disabled'] });

  // Handle focus events so we can apply highlighted
  // style to the focused menu item
  const [isFocused, setFocused] = React.useState(false);
  const { focusProps } = useFocus({ onFocusChange: setFocused });

  return (
    <li
      {...mergeProps(menuItemProps, focusProps)}
      ref={ref}
      style={{
        background: isFocused ? 'gray' : 'transparent',
        color: isFocused ? 'white' : 'black',
        padding: '2px 5px',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {item.rendered}
    </li>
  );
}

const getStyles = (theme: GrafanaTheme2, isActive: boolean) => ({
  container: css`
    position: relative;

    @keyframes dropdown-anim {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }

    ${theme.breakpoints.up('md')} {
      color: ${isActive ? theme.colors.text.primary : theme.colors.text.secondary};

      &:hover {
        background-color: ${theme.colors.action.hover};
        color: ${theme.colors.text.primary};

        .dropdown-menu {
          animation: dropdown-anim 150ms ease-in-out 100ms forwards;
          display: flex;
          // important to overlap it otherwise it can be hidden
          // again by the mouse getting outside the hover space
          left: ${theme.components.sidemenu.width - 1}px;
          margin: 0;
          opacity: 0;
          top: 0;
          z-index: ${theme.zIndex.sidemenu};
        }

        &.dropup .dropdown-menu {
          top: auto;
        }
      }
    }
  `,
  element: css`
    background-color: transparent;
    border: none;
    color: inherit;
    display: block;
    line-height: ${theme.components.sidemenu.width}px;
    padding: 0;
    text-align: center;
    width: ${theme.components.sidemenu.width}px;

    &::before {
      display: ${isActive ? 'block' : 'none'};
      content: ' ';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 2px;
      background-image: ${theme.colors.gradients.brandVertical};
    }

    &:focus-visible {
      background-color: ${theme.colors.action.hover};
      box-shadow: none;
      color: ${theme.colors.text.primary};
      outline: 2px solid ${theme.colors.primary.main};
      outline-offset: -2px;
      transition: none;
    }

    .sidemenu-open--xs & {
      display: none;
    }
  `,
  icon: css`
    height: 100%;
    width: 100%;

    img {
      border-radius: 50%;
      height: 24px;
      width: 24px;
    }
  `,
});
